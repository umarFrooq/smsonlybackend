const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { DateSheet } = require('../../config/mongoose');
const ApiError = require('../../utils/ApiError');

/**
 * Create a datesheet
 * @param {Object} datesheetBody
 * @returns {Promise<DateSheet>}
 */
const createDateSheet = async (datesheetBody, user) => {
  // Normalize schoolId from user object
  const rawSid = user?.schoolId;
  let sid;
  if (!rawSid) sid = undefined;
  else if (typeof rawSid === 'string') sid = rawSid;
  else if (typeof rawSid === 'object') sid = rawSid._id || rawSid.id || rawSid.schoolId || rawSid?.uuid;
  else sid = String(rawSid);
  if (sid) datesheetBody.schoolId = sid;
  datesheetBody.createdBy = user._id;
  return DateSheet.create(datesheetBody);
};

/**
 * Query for datesheets
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryDateSheets = async (filter, options, user) => {
  // Defensive: ensure filter is an object
  filter = filter || {};

  // Remove empty query params that may be passed as empty strings from the frontend
  Object.keys(filter).forEach((k) => {
    if (filter[k] === '' || filter[k] == null) delete filter[k];
  });

  // If a `subject` param was provided (free-text or id), map to subjectId when it's a valid ObjectId
  if (filter.subject) {
    if (mongoose.Types.ObjectId.isValid(String(filter.subject))) {
      filter.subjectId = String(filter.subject);
      delete filter.subject;
    }
    // otherwise keep `subject` as free-text to match the `subject` field
  }

  // If a gradeId filter is provided, translate it to subjectId(s) belonging to that grade
  if (filter.gradeId) {
    try {
      const Subject = require('../subject/subject.model');
      const gradeIdVal = String(filter.gradeId);
      // Restrict subject lookup to the same school if available
      const subjQuery = { gradeId: gradeIdVal };
      if (filter.schoolId) subjQuery.schoolId = filter.schoolId;
      const subjects = await Subject.find(subjQuery).select('_id').lean();
      const subjectIds = Array.isArray(subjects) ? subjects.map(s => String(s._id || s.id)) : [];
      // replace gradeId filter with subjectId filter (if none found, ensure no results)
      delete filter.gradeId;
      if (subjectIds.length) filter.subjectId = { $in: subjectIds };
      else filter.subjectId = { $in: [] };
    } catch (e) {
      // If subject lookup fails, remove gradeId to avoid throwing and continue with original filter
      delete filter.gradeId;
      console.error('Failed to map gradeId to subjects', e);
    }
  }

  // Validate any id-like filters; if invalid ObjectId remove them to avoid Mongoose CastErrors
  ['examId', 'gradeId', 'branchId', 'subjectId'].forEach((k) => {
    if (filter[k] && !mongoose.Types.ObjectId.isValid(String(filter[k]))) delete filter[k];
  });

  // Enforce school scope from the authenticated user
  if (user && user.schoolId) filter.schoolId = user.schoolId;

  const query = { ...filter };
  // For student/teacher roles, default to only announced dateSheets unless the caller
  // explicitly provided a `status` filter. Support a special value 'all' to request
  // all statuses (server will ignore the announcement-only restriction).
  if (user && (user.role === 'student' || user.role === 'teacher')) {
    const providedStatus = Object.prototype.hasOwnProperty.call(filter, 'status') ? filter.status : undefined;
    if (providedStatus === undefined) {
      // No status filter supplied -> restrict to announced
      query.status = 'announced';
    } else if (String(providedStatus).toLowerCase() === 'all') {
      // Caller asked for all statuses -> remove any status constraint
      delete query.status;
    } else {
      // Caller supplied an explicit non-'all' status -> use it (already present in query)
    }
  }

  const datesheets = await DateSheet.paginate(query, {
    ...options,
    populate: 'subjectId,examId.gradeId',
  });
  return datesheets;
};

/**
 * Get datesheet by id
 * @param {ObjectId} id
 * @returns {Promise<DateSheet>}
 */
const getDateSheetById = async (id) => {
  return DateSheet.findById(id);
};

/**
 * Update datesheet by id
 * @param {ObjectId} datesheetId
 * @param {Object} updateBody
 * @returns {Promise<DateSheet>}
 */
const updateDateSheetById = async (datesheetId, updateBody) => {
  const datesheet = await getDateSheetById(datesheetId);
  if (!datesheet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'DateSheet not found');
  }
  Object.assign(datesheet, updateBody);
  await datesheet.save();
  return datesheet;
};

/**
 * Delete datesheet by id
 * @param {ObjectId} datesheetId
 * @returns {Promise<DateSheet>}
 */
const deleteDateSheetById = async (datesheetId) => {
  const datesheet = await getDateSheetById(datesheetId);
  if (!datesheet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'DateSheet not found');
  }
  await datesheet.remove();
  return datesheet;
};

/**
 * Create datesheets for an exam. Idempotent: skips existing entries for the same exam+subject
 * @param {Object} exam - Exam document or plain object (must contain _id or id, schoolId, date, gradeIds/allGrades)
 * @param {Object} user - Authenticated user (used to set schoolId/createdBy)
 * @returns {Promise<{created: number, skipped: number, errors: Array}>}
 */
const createDateSheetsForExam = async (exam, user) => {
  if (!exam) throw new Error('Exam is required');
  const Subject = require('../subject/subject.model');
  const { DateSheet } = require('../../config/mongoose');

  const examId = exam._id || exam.id;
  const schoolId = exam.schoolId || (user && user.schoolId);
  const examDate = exam.date ? new Date(exam.date) : null;

  if (!examId) throw new Error('Exam id is required');
  if (!schoolId) throw new Error('Exam schoolId is required');

  // Build subject query: if exam.allGrades then all subjects in school; otherwise only subjects for the listed grades
  const subjectQuery = { schoolId };
  if (!exam.allGrades && Array.isArray(exam.gradeIds) && exam.gradeIds.length) {
    subjectQuery.gradeId = { $in: exam.gradeIds };
  }

  const subjects = await Subject.find(subjectQuery).lean();
  const result = { created: 0, skipped: 0, errors: [] };
  // also track updates when existing drafts are promoted to announced
  result.updated = 0;

  for (const subj of subjects) {
    try {
      // Check existing DateSheet for this exam+subject within the same school
      const exists = await DateSheet.findOne({ examId, subjectId: subj._id, schoolId });
      if (exists) {
        // If the exam is announced and an existing datesheet is still a draft,
        // promote it to 'announced' so teachers can see it.
        if (String(exam.status).toLowerCase() === 'announced' && String(exists.status).toLowerCase() !== 'announced') {
          exists.status = 'announced';
          await exists.save();
          result.updated += 1;
        } else {
          result.skipped += 1;
        }
        continue;
      }

      const payload = {
        examId,
        subjectId: subj._id,
        subject: subj.title,
        date: examDate || new Date(),
        startTime: '',
        endTime: '',
        roomNumber: '',
        branchId: subj.branchId,
        // schoolId and createdBy will be normalized inside createDateSheet
      };

      // If the exam is already announced, create the datesheet as 'announced'
      if (String(exam.status).toLowerCase() === 'announced') {
        payload.status = 'announced';
      }

      await createDateSheet(payload, user);
      result.created += 1;
    } catch (e) {
      result.errors.push({ subjectId: subj._id, message: e?.message || String(e) });
    }
  }

  return result;
};

module.exports = {
  createDateSheet,
  queryDateSheets,
  getDateSheetById,
  updateDateSheetById,
  deleteDateSheetById,
  createDateSheetsForExam,
};

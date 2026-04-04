const httpStatus = require('http-status');
const Result = require('./result.model');
const ApiError = require('../../utils/ApiError');
const User = require('../user/user.model');
const Exam = require('../exam/exam.model');
const Subject = require('../subject/subject.model');
const ClassSchedule = require('../class-schedule/class-schedule.model');
const { sendResultAnnouncementEmail } = require('../notifications/email.service');

/**
 * Create a result
 * @param {Object} resultBody
 * @returns {Promise<Result>}
 */
const createResult = async (resultBody, schoolId, user) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }

  const { examId, studentId, subjectId } = resultBody;

  const student = await User.findOne({ _id: studentId, schoolId });
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found in this school.');
  }

  if (examId) {
    const exam = await Exam.findOne({ _id: examId, schoolId });
    if (!exam) throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found in this school.');
  }

  if (subjectId) {
    const subject = await Subject.findOne({ _id: subjectId, schoolId });
    if (!subject) throw new ApiError(httpStatus.NOT_FOUND, 'Subject not found in this school.');
  }

  // Permission checks: teachers can only create results for their assigned classes
  if (user && user.role === 'teacher') {
    const teacherHasClass = await ClassSchedule.exists({
      teacherId: user.id,
      subjectId: subjectId,
      gradeId: student.gradeId,
      branchId: student.branchId,
      schoolId,
    });

    // allow if teacher belongs to same branch as a fallback
    const branchMatch = user.branchId && student.branchId && String(user.branchId) === String(student.branchId);

    if (!teacherHasClass && !branchMatch) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to add results for this student/subject.');
    }
  }

  const payload = {
    ...resultBody,
    schoolId,
    gradeId: student.gradeId,
    branchId: student.branchId,
  };

  try {
    return await Result.create(payload);
  } catch (error) {
    if (error.code === 11000 || (error.message && error.message.includes('duplicate key error'))) {
      throw new ApiError(httpStatus.CONFLICT, 'Result already exists.');
    }
    throw error;
  }
};

/**
 * Query for results
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryResults = async (filter, options, schoolId, user) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query results.');
  }
  // Defensive: if caller passed populated objects for id fields (e.g. gradeId as object),
  // convert them to plain id strings so Mongoose can cast to ObjectId correctly.
  const sanitizeIdField = (val) => {
    if (val == null) return val;
    if (Array.isArray(val)) return val.map(v => (v && (v._id || v.id)) || v);
    if (typeof val === 'object') return (val._id || val.id || String(val));
    return val;
  };

  const cleanedFilter = { ...(filter || {}) };
  ['gradeId', 'examId', 'studentId', 'subjectId', 'branchId'].forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(cleanedFilter, k)) {
      cleanedFilter[k] = sanitizeIdField(cleanedFilter[k]);
    }
  });

  const schoolScopedFilter = { ...cleanedFilter, schoolId };

  // Students see only their own results (controller also enforces, but double-check)
  if (user && user.role === 'student') {
    schoolScopedFilter.studentId = user.id;
    // Students should only be able to see results that have been announced
    schoolScopedFilter.status = 'announced';
  }

  // Teachers should be scoped to their branch as a simple rule
  if (user && user.role === 'teacher' && user.branchId) {
    schoolScopedFilter.branchId = user.branchId;
  }

  // If caller requested populate via options.populate, run a populated find (paginated populate support
  // may not be available depending on paginate plugin), so handle populate explicitly for those cases.
  if (options && options.populate) {
    // support comma separated populate string like 'subjectId,examId'
    const populateFields = String(options.populate).split(',').map(f => f.trim()).filter(Boolean);
    let query = Result.find(schoolScopedFilter);
    populateFields.forEach((p) => {
      // if field includes select like 'studentId:fullname email' handle select
      const [path, select] = p.split(':').map(s => s && s.trim());
      if (select) query = query.populate({ path, select });
      else query = query.populate(path);
    });
    const docs = await query.exec();
    return {
      results: docs,
      page: 1,
      limit: docs.length,
      totalPages: 1,
      totalResults: docs.length,
    };
  }

  const results = await Result.paginate(schoolScopedFilter, options);
  return results;
};

/**
 * Announce results matching a filter by setting their status to 'announced'
 * and sending notification emails to affected students.
 * @param {Object} filter
 * @param {string} schoolId
 * @param {Object} user
 * @returns {Promise<Array<Result>>}
 */
const announceResults = async (payload, schoolId, user) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to announce results.');
  }

  // payload may be { ids: [...]} or { filter: {...} }
  const announced = [];

  let resultsToAnnounce = [];
  if (payload && Array.isArray(payload.ids) && payload.ids.length > 0) {
    resultsToAnnounce = await Result.find({ _id: { $in: payload.ids }, schoolId }).exec();
  } else {
    const filter = (payload && payload.filter) || {};
    const schoolScopedFilter = { ...filter, schoolId };
    resultsToAnnounce = await Result.find(schoolScopedFilter).exec();
  }

  for (const r of resultsToAnnounce) {
    // skip if already announced
    if (r.status === 'announced') {
      announced.push(r);
      continue;
    }
    // update status and save via updateResultById to ensure notifications and permission checks
    const updated = await updateResultById(r._id, { status: 'announced' }, schoolId, user);
    announced.push(updated);
  }

  return announced;
};

/**
 * Get result by id
 * @param {ObjectId} id
 * @returns {Promise<Result>}
 */
const getResultById = async (id, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  let query = Result.findOne({ _id: id, schoolId });

  if (populateOptionsStr) {
    populateOptionsStr.split(',').forEach(popField => {
      const [path, select] = popField.trim().split(':');
      if (select) {
        query = query.populate({ path, select });
      } else {
        query = query.populate(path);
      }
    });
  } else {
    query = query.populate('studentId', 'fullname email')
                 .populate('subjectId', 'title')
                 .populate('gradeId', 'title')
                 .populate('branchId', 'name')
                 .populate('examId', 'name');
  }

  const result = await query.exec();
  return result;
};

/**
 * Update result by id
 * @param {ObjectId} resultId
 * @param {Object} updateBody
 * @returns {Promise<Result>}
 */
const updateResultById = async (resultId, updateBody, schoolId, user) => {
  const result = await Result.findOne({ _id: resultId, schoolId });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Result not found');
  }

  // Permission checks
  if (user && user.role === 'student' && String(result.studentId) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this result.');
  }
  if (user && user.role === 'teacher' && user.branchId && String(result.branchId) !== String(user.branchId)) {
    // fallback simple rule: teacher can only update results in their branch
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this result.');
  }

  // Defensive: ensure any id-like fields in updateBody are plain ids (not full objects)
  if (updateBody && typeof updateBody === 'object') {
    const coerce = (v) => {
      if (v == null) return v;
      if (Array.isArray(v)) return v.map(x => (x && (x._id || x.id)) || x);
      if (typeof v === 'object') return (v._id || v.id || String(v));
      return v;
    };
    if (Object.prototype.hasOwnProperty.call(updateBody, 'gradeId')) updateBody.gradeId = coerce(updateBody.gradeId);
    if (Object.prototype.hasOwnProperty.call(updateBody, 'branchId')) updateBody.branchId = coerce(updateBody.branchId);
    if (Object.prototype.hasOwnProperty.call(updateBody, 'examId')) updateBody.examId = coerce(updateBody.examId);
    if (Object.prototype.hasOwnProperty.call(updateBody, 'studentId')) updateBody.studentId = coerce(updateBody.studentId);
    if (Object.prototype.hasOwnProperty.call(updateBody, 'subjectId')) updateBody.subjectId = coerce(updateBody.subjectId);
  }

  Object.assign(result, updateBody, { updatedBy: user ? user.id : undefined });
  await result.save();

  if (updateBody.status === 'announced') {
    const student = await User.findById(result.studentId);
    if (student && student.email) {
      await sendResultAnnouncementEmail(student.email, result, student);
    }
  }

  return result;
};

/**
 * Delete result by id
 * @param {ObjectId} resultId
 * @returns {Promise<Result>}
 */
const deleteResultById = async (resultId, schoolId, user) => {
  const result = await Result.findOne({ _id: resultId, schoolId });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Result not found');
  }

  if (user && user.role === 'student' && String(result.studentId) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this result.');
  }
  if (user && user.role === 'teacher' && user.branchId && String(result.branchId) !== String(user.branchId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this result.');
  }

  await result.remove();
  return result;
};

const bulkUpdateResults = async (resultsData, schoolId, user) => {
  const results = [];
  for (const resultData of resultsData) {
    let result;
    if (resultData.id) {
      result = await updateResultById(resultData.id, resultData, schoolId, user);
    } else {
      result = await createResult(resultData, schoolId, user);
    }
    results.push(result);
  }
  return results;
};

module.exports = {
  createResult,
  queryResults,
  getResultById,
  updateResultById,
  deleteResultById,
  bulkUpdateResults,
  announceResults,
};

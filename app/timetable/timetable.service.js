const httpStatus = require('http-status');
const  Timetable  = require('./timetable.model'); // Assuming Timetable model is exported from index.js
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const Subject = require('../subject/subject.model'); // Adjust path as needed
const User = require('../user/user.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');

/**
 * Helper to validate related entities for timetable creation/update against a given schoolId
 * @param {Object} timetableBody - Contains gradeId, branchId, schedule
 * @param {ObjectId} schoolId - The schoolId to validate against
 */
const validateTimetableEntities = async (timetableBody, schoolId) => {
  const { gradeId, branchId, schedule } = timetableBody;

  if (!schoolId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'School context is missing for validation.');
  }

  if (gradeId) {
    const grade = await Grade.findOne({ _id: gradeId, schoolId });
    if (!grade) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Grade with ID ${gradeId} not found in this school.`);
    }
    if (timetableBody.section && !grade.sections.map(s=>s.toUpperCase()).includes(timetableBody.section.toUpperCase())) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Section ${timetableBody.section} not found in Grade ${grade.title} for this school.`);
    }
  }

  if (branchId) {
    const branch = await Branch.findOne({ _id: branchId, schoolId });
    if (!branch) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found in this school.`);
    }
     // Check if grade belongs to this branch
    if (gradeId) {
        const grade = await Grade.findOne({ _id: gradeId, branchId, schoolId });
        if (!grade) throw new ApiError(httpStatus.BAD_REQUEST, `Grade does not belong to the specified branch in this school.`);
    }
  }

  if (schedule && schedule.length > 0) {
    for (const entry of schedule) {
      if (entry.subjectId) {
        const subject = await Subject.findOne({ _id: entry.subjectId, schoolId }); // Check subject within school
        if (!subject) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Subject with ID ${entry.subjectId} not found in this school's schedule.`);
        }
        // Optionally, check if subject.branchId matches timetable's branchId if subjects are branch-specific in that way
      }
      if (entry.teacherId) {
        const teacher = await User.findOne({ _id: entry.teacherId, schoolId, role: {$in: ['teacher', 'staff', 'admin_education', 'superadmin']} }); // Teacher must be in same school
        if (!teacher) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Teacher with ID ${entry.teacherId} not found in this school or is not a valid teacher/staff.`);
        }
      }
    }
  }
};

/**
 * Deactivate other active timetables for the same grade, section, branch, and school
 * @param {ObjectId} schoolId
 * @param {ObjectId} gradeId
 * @param {String} section
 * @param {ObjectId} branchId
 * @param {ObjectId} [excludeTimetableId] - Timetable ID to exclude
 */
const deactivateOtherActiveTimetables = async (schoolId, gradeId, section, branchId, excludeTimetableId) => {
  const filter = {
    schoolId,
    gradeId,
    section,
    branchId,
    isActive: true,
  };
  if (excludeTimetableId) {
    filter._id = { $ne: excludeTimetableId };
  }
  await Timetable.updateMany(filter, { $set: { isActive: false } });
};

/**
 * Create a timetable
 * @param {Object} timetableData - Data for the timetable
 * @param {ObjectId} schoolId - The ID of the school
 * @param {ObjectId} [createdByUserId] - Optional ID of the user creating
 * @returns {Promise<Timetable>}
 */
const createTimetable = async (timetableData, schoolId, createdByUserId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to create a timetable.');
  }
  await validateTimetableEntities(timetableData, schoolId);

  if (timetableData.isActive === undefined || timetableData.isActive === true) {
    await deactivateOtherActiveTimetables(schoolId, timetableData.gradeId, timetableData.section, timetableData.branchId);
    timetableData.isActive = true;
  }
  
  const timetablePayload = { ...timetableData, schoolId };
  // if (createdByUserId) timetablePayload.createdBy = createdByUserId; // If model has createdBy

  try {
    const timetable = await Timetable.create(timetablePayload);
    return timetable;
  } catch (error) {
     if (error.code === 11000 || (error.message && error.message.includes("duplicate key error")) ) {
       throw new ApiError(httpStatus.CONFLICT, 'A timetable for this school, grade, section, branch, and effective date already exists.');
     }
     throw error;
  }
};

/**
 * Query for timetables
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<QueryResult>}
 */
const queryTimetables = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query timetables.');
  }
  const schoolScopedFilter = { ...filter, schoolId };

  const timetables = await Timetable.paginate(schoolScopedFilter, options);
  return timetables;
};

/**
 * Get timetable by id
 * @param {ObjectId} timetableId - Timetable ID
 * @param {ObjectId} schoolId - School ID
 * @param {String} [populateOptionsStr] - Comma separated string for population
 * @returns {Promise<Timetable>}
 */
const getTimetableById = async (timetableId, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  let query = Timetable.findOne({ _id: timetableId, schoolId });
  
  if (populateOptionsStr) {
    populateOptionsStr.split(',').forEach(popField => {
      const [path, select] = popField.trim().split(':');
      if (select) { query = query.populate({ path, select }); } else { query = query.populate(path); }
    });
  } else { // Default population
    query = query.populate('gradeId', 'title')
                 .populate('branchId', 'name')
                 .populate('schedule.subjectId', 'title subjectCode')
                 .populate('schedule.teacherId', 'fullname email');
  }
  const timetable = await query.exec();
  if (!timetable) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Timetable not found or not associated with this school.');
  }
  return timetable;
};

/**
 * Get the effective timetable for a specific grade, section, branch, school, and date
 * @param {ObjectId} schoolId
 * @param {ObjectId} gradeId
 * @param {String} section
 * @param {ObjectId} branchId
 * @param {Date} date
 * @returns {Promise<Timetable|null>}
 */
const getEffectiveTimetable = async (schoolId, gradeId, section, branchId, date) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  const effectiveDate = date ? new Date(date) : new Date();

  const timetable = await Timetable.findOne({
    schoolId,
    gradeId,
    section: section.toUpperCase(),
    branchId,
    isActive: true,
    effectiveDate: { $lte: effectiveDate },
  })
  .sort({ effectiveDate: -1 })
  .populate('gradeId', 'title')
  .populate('branchId', 'name')
  .populate('schedule.subjectId', 'title subjectCode')
  .populate('schedule.teacherId', 'fullname email');

  return timetable;
};

/**
 * Update timetable by id
 * @param {ObjectId} timetableId - Timetable ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID
 * @param {ObjectId} [updatedByUserId] - Optional ID of the user updating
 * @returns {Promise<Timetable>}
 */
const updateTimetableById = async (timetableId, updateBody, schoolId, updatedByUserId) => {
  const timetable = await getTimetableById(timetableId, schoolId); // Ensures timetable belongs to school

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a timetable.');
  }
  delete updateBody.schoolId;

  // Validate related entities if they are part of updateBody or if critical identifiers change
  const entitiesToValidate = { ...timetable.toObject(), ...updateBody };
  await validateTimetableEntities(entitiesToValidate, schoolId);
  
  if (updateBody.isActive === true && !timetable.isActive) {
    await deactivateOtherActiveTimetables(schoolId, timetable.gradeId, timetable.section, timetable.branchId, timetableId);
  }
  
  Object.assign(timetable, updateBody);
  // if (updatedByUserId) timetable.updatedBy = updatedByUserId; // If model has updatedBy
  await timetable.save();
  return getTimetableById(timetableId, schoolId, 'gradeId branchId schedule.subjectId schedule.teacherId');
};

/**
 * Delete timetable by id
 * @param {ObjectId} timetableId - Timetable ID
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Timetable>}
 */
const deleteTimetableById = async (timetableId, schoolId) => {
  const timetable = await getTimetableById(timetableId, schoolId); // Ensures timetable belongs to school
  await timetable.remove();
  return timetable;
};

module.exports = {
  createTimetable,
  queryTimetables,
  getTimetableById,
  getEffectiveTimetable,
  updateTimetableById,
  deleteTimetableById,
};

const httpStatus = require('http-status');
const ClassSchedule = require('./class-schedule.model');
const ApiError = require('../../utils/ApiError');
const { checkSchoolBranchGradeSubjectTeacherExist } = require('../../utils/existenceValidators'); // Assuming a utility for this
const User = require('../user/user.model');
const Subject = require('../subject/subject.model');
const Grade = require('../grade/grade.model');
const Branch = require('../branch/branch.model');

/**
 * Create a class schedule
 * @param {Object} scheduleBody
 * @param {ObjectId} userId - user creating the schedule
 * @returns {Promise<ClassSchedule>}
 */
const createClassSchedule = async (scheduleBody, userId) => {
  // Validate that related entities exist and belong to the same school/branch if necessary
  // This check might be more complex depending on how entities are scoped.
  // For now, basic existence check:
  await checkSchoolBranchGradeSubjectTeacherExist(
    scheduleBody.schoolId,
    scheduleBody.branchId,
    scheduleBody.gradeId,
    scheduleBody.subjectId,
    scheduleBody.teacherId
  );

  // Add createdBy user
  const scheduleToSave = { ...scheduleBody, createdBy: userId };

  try {
    return await ClassSchedule.create(scheduleToSave);
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      if (error.message.includes('unique_class_schedule_slot')) {
        throw new ApiError(httpStatus.CONFLICT, 'This class schedule (school, branch, grade, section, subject, day, time) already exists.');
      }
      if (error.message.includes('unique_teacher_timeslot')) {
        throw new ApiError(httpStatus.CONFLICT, 'This teacher already has a class scheduled at this day and time.');
      }
    }
    throw error;
  }
};

/**
 * Query for class schedules with pagination and population
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {string} [options.populate] - Fields to populate (e.g., "subjectId,gradeId,teacherId")
 * @returns {Promise<QueryResult>}
 */
const queryClassSchedules = async (filter, options) => {
  const { populate, ...restOptions } = options;
  // Add schoolId scoping to filter if not already present by a higher-level middleware
  // For now, assuming filter might come with schoolId from controller based on user's scope

  const paginatedResults = await ClassSchedule.paginate(filter, restOptions);

  if (populate && paginatedResults.results && paginatedResults.results.length > 0) {
    const populationFields = populate.split(',').map(field => field.trim());
    const validPopulationPaths = [];

    for (const path of populationFields) {
        let pathDetails = { path };
        if (path === 'teacherId') pathDetails.select = 'id fullname email role'; // Select specific fields for teacher
        if (path === 'subjectId') pathDetails.select = 'id title code schoolId branchId';
        if (path === 'gradeId') pathDetails.select = 'id title schoolId branchId';
        if (path === 'branchId') pathDetails.select = 'id name schoolId';
        if (path === 'schoolId') pathDetails.select = 'id name';
        validPopulationPaths.push(pathDetails);
    }
    if (validPopulationPaths.length > 0) {
        await ClassSchedule.populate(paginatedResults.results, validPopulationPaths);
    }
  }
  return paginatedResults;
};


/**
 * Get class schedule by id
 * @param {ObjectId} id
 * @param {ObjectId} [schoolId] - Optional schoolId for scoping
 * @param {string} [populateFields] - Comma separated string of fields to populate
 * @returns {Promise<ClassSchedule>}
 */
const getClassScheduleById = async (id, schoolId = null, populateFields = null) => {
  const query = { _id: id };
  if (schoolId) {
    query.schoolId = schoolId; // Ensure it belongs to the specified school if schoolId is provided
  }

  let scheduleQuery = ClassSchedule.findOne(query);

  if (populateFields) {
    const populationArray = [];
    populateFields.split(',').forEach(field => {
        let pathDetails = { path: field.trim() };
        if (field.trim() === 'teacherId') pathDetails.select = 'id fullname email role';
        if (field.trim() === 'subjectId') pathDetails.select = 'id title code schoolId branchId';
        if (field.trim() === 'gradeId') pathDetails.select = 'id title schoolId branchId';
        if (field.trim() === 'branchId') pathDetails.select = 'id name schoolId';
        if (field.trim() === 'schoolId') pathDetails.select = 'id name';
        populationArray.push(pathDetails);
    });
    if (populationArray.length > 0) {
        scheduleQuery = scheduleQuery.populate(populationArray);
    }
  }

  const schedule = await scheduleQuery.exec();
  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class Schedule not found');
  }
  return schedule;
};

/**
 * Update class schedule by id
 * @param {ObjectId} scheduleId
 * @param {Object} updateBody
 * @param {ObjectId} userId - user performing the update
 * @param {ObjectId} [schoolId] - Optional schoolId for scoping
 * @returns {Promise<ClassSchedule>}
 */
const updateClassScheduleById = async (scheduleId, updateBody, userId, schoolId = null) => {
  const schedule = await getClassScheduleById(scheduleId, schoolId); // Ensures found and scoped if schoolId provided

  // If trying to change schoolId, it should be handled carefully or disallowed.
  if (updateBody.schoolId && updateBody.schoolId.toString() !== schedule.schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a class schedule.');
  }
  // Prevent changing schoolId if not explicitly allowed
  delete updateBody.schoolId;


  // Re-validate related entities if they are part of the update
  const { branchId, gradeId, subjectId, teacherId } = { ...schedule.toObject(), ...updateBody };
  await checkSchoolBranchGradeSubjectTeacherExist(
    schedule.schoolId, // school context doesn't change
    branchId,
    gradeId,
    subjectId,
    teacherId
  );

  Object.assign(schedule, updateBody, { updatedBy: userId });

  try {
    await schedule.save();
    return schedule;
  } catch (error) {
     if (error.code === 11000) { // Duplicate key error
      if (error.message.includes('unique_class_schedule_slot')) {
        throw new ApiError(httpStatus.CONFLICT, 'This class schedule (school, branch, grade, section, subject, day, time) already exists.');
      }
      if (error.message.includes('unique_teacher_timeslot')) {
        throw new ApiError(httpStatus.CONFLICT, 'This teacher already has a class scheduled at this day and time.');
      }
    }
    throw error;
  }
};

/**
 * Delete class schedule by id
 * @param {ObjectId} scheduleId
 * @param {ObjectId} [schoolId] - Optional schoolId for scoping
 * @returns {Promise<ClassSchedule>}
 */
const deleteClassScheduleById = async (scheduleId, schoolId = null) => {
  const schedule = await getClassScheduleById(scheduleId, schoolId); // Ensures found and scoped
  await schedule.remove();
  return schedule;
};

module.exports = {
  createClassSchedule,
  queryClassSchedules,
  getClassScheduleById,
  updateClassScheduleById,
  deleteClassScheduleById,
};

// Placeholder for existence validator - this should be in a shared util file
// For now, including a simplified version here.
// In a real app, this would be more robust, checking against the DB.
// utils/existenceValidators.js
/*
async function checkSchoolBranchGradeSubjectTeacherExist(schoolId, branchId, gradeId, subjectId, teacherId) {
    const school = await School.findById(schoolId);
    if (!school) throw new ApiError(httpStatus.NOT_FOUND, 'School not found');

    const branch = await Branch.findOne({ _id: branchId, schoolId });
    if (!branch) throw new ApiError(httpStatus.NOT_FOUND, `Branch not found or not in school ${schoolId}`);

    const grade = await Grade.findOne({ _id: gradeId, schoolId, branchId });
    if (!grade) throw new ApiError(httpStatus.NOT_FOUND, `Grade not found or not in branch ${branchId}`);

    const subject = await Subject.findOne({ _id: subjectId, schoolId, branchId });
    if (!subject) throw new ApiError(httpStatus.NOT_FOUND, `Subject not found or not in branch ${branchId}`);

    const teacher = await User.findOne({ _id: teacherId, schoolId, role: 'teacher' }); // Assuming teacher role
    if (!teacher) throw new ApiError(httpStatus.NOT_FOUND, `Teacher not found in school ${schoolId} or is not a teacher`);
}
module.exports = { checkSchoolBranchGradeSubjectTeacherExist }
*/
// For the above to work, School, Branch, Grade, Subject models need to be imported.
// I'll create a simplified version of this validator later or assume it exists.
// For now, the service methods call it, but it's not defined in this file.
// I will create a basic version of `utils/existenceValidators.js` next.

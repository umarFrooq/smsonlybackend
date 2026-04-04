const httpStatus = require('http-status');
const  Attendance  = require('./attendance.model'); // Assuming Attendance model is exported from index.js
const User = require('../user/user.model'); // Adjust path as needed
const Subject = require('../subject/subject.model'); // Adjust path as needed
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');

/**
 * Helper to validate related entities for a single attendance record against a given schoolId
 * @param {Object} attendanceBody - Contains studentId, subjectId, gradeId, branchId, section
 * @param {ObjectId} schoolId - The schoolId to validate against
 */
const validateAttendanceEntities = async (attendanceBody, schoolId) => {
  const { studentId, subjectId, gradeId, branchId, section } = attendanceBody;

  if (!schoolId) { // Should be passed by the service function
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'School context is missing for validation.');
  }

  const student = await User.findOne({ _id: studentId, schoolId });
  if (!student || !['student', 'user'].includes(student.role) ) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Student with ID ${studentId} not found in this school or is not a student.`);
  }

  const subject = await Subject.findOne({ _id: subjectId, schoolId });
  if (!subject) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Subject with ID ${subjectId} not found in this school.`);
  }

  const grade = await Grade.findOne({ _id: gradeId, schoolId });
  if (!grade) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Grade with ID ${gradeId} not found in this school.`);
  }
  if (!grade.sections.map(s=>s.toUpperCase()).includes(section.toUpperCase())) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Section ${section} not found in Grade ${grade.title} for this school.`);
  }

  const branch = await Branch.findOne({ _id: branchId, schoolId });
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found in this school.`);
  }

  // Ensure all entities belong to the same branch and that branch belongs to the school (already checked for branch)
  // if (subject.branchId.toString() !== branchId.toString()) {
  //     throw new ApiError(httpStatus.BAD_REQUEST, `Subject ${subject.title} does not belong to the specified branch ${branch.name}.`);
  // }
  // Grade model's branchId is an object if populated, or ObjectId if not.
  // Assuming grade.branchId is an ObjectId here. If it's populated, access grade.branchId._id
  const gradeBranchId = grade.branchId._id ? grade.branchId._id.toString() : grade.branchId.toString();
  if (gradeBranchId !== branchId.toString()) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Grade ${grade.title} does not belong to the specified branch ${branch.name}.`);
  }
  // Student model's branchId needs to be checked similarly if students are tied to branches.
  if (student.branchId && student.branchId.toString() !== branchId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Student ${student.fullname} does not belong to the specified branch ${branch.name}.`);
  }
   // TODO: Future: Check if student is enrolled in this grade/section/subject. This requires an enrollment module.
};


/**
 * Mark a single attendance record
 * @param {Object} attendanceData - Data for attendance
 * @param {ObjectId} schoolId - The ID of the school
 * @param {ObjectId} markedByUserId - ID of the user marking attendance
 * @returns {Promise<Attendance>}
 */
const markSingleAttendance = async (attendanceData, schoolId, markedByUserId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  await validateAttendanceEntities(attendanceData, schoolId);
  
  try {
    const attendancePayload = { ...attendanceData, schoolId, markedBy: markedByUserId };
    const attendance = await Attendance.create(attendancePayload);
    return attendance;
  } catch (error) {
    if (error.code === 11000 || error.message.includes("duplicate key error")) { // Mongoose duplicate key error
      throw new ApiError(httpStatus.CONFLICT, 'Attendance record for this student, subject, grade, section and date already exists.');
    }
    throw error; // Re-throw other errors
  }
};

/**
 * Mark bulk attendance records
 * @param {Array<Object>} attendanceEntriesArray - Array of attendance data objects
 * @param {ObjectId} schoolId - The ID of the school
 * @param {ObjectId} markedByUserId - ID of the user marking attendance
 * @returns {Promise<{success: Array<Attendance>, errors: Array<Object>}>}
 */
const markBulkAttendance = async (attendanceEntriesArray, schoolId, markedByUserId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required for bulk attendance.');
  }
  const results = {
    success: [],
    errors: [],
  };

  for (const entry of attendanceEntriesArray) {
    try {
      await validateAttendanceEntities(entry, schoolId); // Validate each entry against the school

      // Simple duplicate check within the current batch
      const existingInBatch = results.success.find(s => 
        s.studentId.toString() === entry.studentId &&
        s.subjectId.toString() === entry.subjectId &&
        s.gradeId.toString() === entry.gradeId &&
        s.section.toUpperCase() === entry.section.toUpperCase() && // Ensure section comparison is consistent
        new Date(s.date).toISOString().split('T')[0] === new Date(entry.date).toISOString().split('T')[0]
      );
      if (existingInBatch) {
          results.errors.push({ entry, error: 'Duplicate entry in this batch for the same student, subject, grade, section, and date.' });
          continue;
      }

      const attendancePayload = { ...entry, schoolId, markedBy: markedByUserId };
      const attendance = await Attendance.create(attendancePayload);
      results.success.push(attendance);
    } catch (error) {
       if (error.code === 11000 || (error.message && error.message.includes("duplicate key error")) ) {
         results.errors.push({ entry, error: 'Attendance record for this student, subject, grade, section and date already exists in DB.' });
       } else if (error instanceof ApiError) {
        results.errors.push({ entry, error: error.message });
      } else {
        results.errors.push({ entry, error: 'An unexpected error occurred processing this entry.' });
      }
    }
  }
  return results;
};

/**
 * Query for attendance records
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<QueryResult>}
 */
const queryAttendances = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query attendance records.');
  }
  const schoolScopedFilter = { ...filter, schoolId };

  if (schoolScopedFilter.teacherId) {
    schoolScopedFilter.markedBy = schoolScopedFilter.teacherId;
    delete schoolScopedFilter.teacherId;
  }

  if (schoolScopedFilter.section) {
    schoolScopedFilter.section = schoolScopedFilter.section.toUpperCase();
  }

  const { populate, ...restOptions } = options;
  
  // Handle date range queries
  if (schoolScopedFilter.startDate && schoolScopedFilter.endDate) {
    const endOfDay = new Date(schoolScopedFilter.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    schoolScopedFilter.date = { $gte: new Date(schoolScopedFilter.startDate), $lte: endOfDay };
    delete schoolScopedFilter.startDate;
    delete schoolScopedFilter.endDate;
  } else if (schoolScopedFilter.startDate) {
    schoolScopedFilter.date = { $gte: new Date(schoolScopedFilter.startDate) };
    delete schoolScopedFilter.startDate;
  } else if (schoolScopedFilter.endDate) {
    const endOfDay = new Date(schoolScopedFilter.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    schoolScopedFilter.date = { $lte: endOfDay };
    delete schoolScopedFilter.endDate;
  }

  // The paginate plugin should handle population if specified in options.populate
  // The manual population logic here might be redundant or conflict with the paginate plugin's way.
  // Assuming standard usage of mongoose-paginate-v2 where options.populate is an object or string.
  // --- MODIFICATION START ---
  // The custom paginate plugin (utils/mongoose/mongoose.paginate.js) does not seem to handle 'populate' in options.
  // So, we'll call paginate and then manually populate the results if 'populate' option is provided.
  const paginatedResults = await Attendance.paginate(schoolScopedFilter, restOptions);

  if (options.populate && paginatedResults.results && paginatedResults.results.length > 0) {
    // Mongoose populate can accept a comma or space-separated string for paths.
    const populationPaths = options.populate.split(',').map(field => field.trim()).join(' ');
    // Ensure the paths actually exist on the Attendance model and are refs.
    // Example: 'studentId subjectId markedBy gradeId branchId'
    await Attendance.populate(paginatedResults.results, populationPaths);
  }

  return paginatedResults;
  // --- MODIFICATION END ---
};

/**
 * Get attendance record by id
 * @param {ObjectId} id - Attendance ID
 * @param {ObjectId} schoolId - School ID
 * @param {String} [populateOptionsStr] - Comma separated string of fields to populate
 * @returns {Promise<Attendance>}
 */
const getAttendanceById = async (id, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  let query = Attendance.findOne({ _id: id, schoolId });

  if (populateOptionsStr) {
    populateOptionsStr.split(',').forEach((populateOption) => {
      const parts = populateOption.split(':');
      let path = parts[0].trim();
      let select = parts.length > 1 ? parts.slice(1).join(':').trim() : ''; // Join back if select itself has colons
      if (select) {
        query = query.populate({ path, select });
      } else {
        query = query.populate(path);
      }
    });
  }
  const attendance = await query.exec();
  if (!attendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attendance record not found or not associated with this school.');
  }
  return attendance;
};

/**
 * Update attendance record by id
 * @param {ObjectId} attendanceId - Attendance ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID
 * @param {ObjectId} updatedByUserId - ID of the user performing the update
 * @returns {Promise<Attendance>}
 */
const updateAttendanceById = async (attendanceId, updateBody, schoolId, updatedByUserId) => {
  const attendance = await getAttendanceById(attendanceId, schoolId); // Ensures record belongs to school

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of an attendance record.');
  }
  delete updateBody.schoolId; // Prevent schoolId modification

  // If critical fields like studentId, subjectId, date, etc., are being changed,
  // re-validation might be needed using validateAttendanceEntities.
  // For simplicity, assuming only status and remarks are typically updated.
  // If attendanceBody contains other fields, it might need re-validation.
  // Example: If date changes, the duplicate check logic might be relevant again.

  Object.assign(attendance, updateBody, { markedBy: updatedByUserId });
  await attendance.save();
  return attendance;
};

/**
 * Delete attendance record by id
 * @param {ObjectId} attendanceId - Attendance ID
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Attendance>}
 */
const deleteAttendanceById = async (attendanceId, schoolId) => {
  const attendance = await getAttendanceById(attendanceId, schoolId); // Ensures record belongs to school
  await attendance.remove();
  return attendance;
};

module.exports = {
  markSingleAttendance,
  markBulkAttendance,
  queryAttendances,
  getAttendanceById,
  updateAttendanceById,
  deleteAttendanceById,
};

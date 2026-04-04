const httpStatus = require('http-status');
const TeacherAttendance = require('./teacher-attendance.model');
const User = require('../user/user.model');
const Branch = require('../branch/branch.model');
const ApiError = require('../../utils/ApiError');

const validateAttendanceEntities = async (attendanceBody, schoolId) => {
  const { teacherId, branchId } = attendanceBody;

  if (!schoolId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'School context is missing for validation.');
  }

  const teacher = await User.findOne({ _id: teacherId, schoolId, role: 'teacher' });
  if (!teacher) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Teacher with ID ${teacherId} not found in this school.`);
  }

  const branch = await Branch.findOne({ _id: branchId, schoolId });
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found in this school.`);
  }

  if (teacher.branchId && teacher.branchId.toString() !== branchId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Teacher ${teacher.fullname} does not belong to the specified branch ${branch.name}.`);
  }
};

const markSingleAttendance = async (attendanceData, schoolId, markedByUserId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  await validateAttendanceEntities(attendanceData, schoolId);

  try {
    const attendancePayload = { ...attendanceData, schoolId, markedBy: markedByUserId };
    const attendance = await TeacherAttendance.create(attendancePayload);
    return attendance;
  } catch (error) {
    if (error.code === 11000 || error.message.includes("duplicate key error")) {
      throw new ApiError(httpStatus.CONFLICT, 'Attendance record for this teacher and date already exists.');
    }
    throw error;
  }
};

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
      await validateAttendanceEntities(entry, schoolId);

      const existingInBatch = results.success.find(s =>
        s.teacherId.toString() === entry.teacherId &&
        new Date(s.date).toISOString().split('T')[0] === new Date(entry.date).toISOString().split('T')[0]
      );
      if (existingInBatch) {
        results.errors.push({ entry, error: 'Duplicate entry in this batch for the same teacher and date.' });
        continue;
      }

      const attendancePayload = { ...entry, schoolId, markedBy: markedByUserId };
      const attendance = await TeacherAttendance.create(attendancePayload);
      results.success.push(attendance);
    } catch (error) {
      if (error.code === 11000 || (error.message && error.message.includes("duplicate key error"))) {
        results.errors.push({ entry, error: 'Attendance record for this teacher and date already exists in DB.' });
      } else if (error instanceof ApiError) {
        results.errors.push({ entry, error: error.message });
      } else {
        results.errors.push({ entry, error: 'An unexpected error occurred processing this entry.' });
      }
    }
  }
  return results;
};

const queryAttendances = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query attendance records.');
  }
  const schoolScopedFilter = { ...filter, schoolId };

  const { populate, ...restOptions } = options;

  if (schoolScopedFilter.startDate && schoolScopedFilter.endDate) {
    schoolScopedFilter.date = { $gte: new Date(schoolScopedCopedFilter.startDate), $lte: new Date(schoolScopedFilter.endDate) };
    delete schoolScopedFilter.startDate;
    delete schoolScopedFilter.endDate;
  } else if (schoolScopedFilter.startDate) {
    schoolScopedFilter.date = { $gte: new Date(schoolScopedFilter.startDate) };
    delete schoolScopedFilter.startDate;
  } else if (schoolScopedFilter.endDate) {
    schoolScopedFilter.date = { $lte: new Date(schoolScopedFilter.endDate) };
    delete schoolScopedFilter.endDate;
  }

  const paginatedResults = await TeacherAttendance.paginate(schoolScopedFilter, restOptions);

  if (options.populate && paginatedResults.results && paginatedResults.results.length > 0) {
    const populationPaths = options.populate.split(',').map(field => field.trim()).join(' ');
    await TeacherAttendance.populate(paginatedResults.results, populationPaths);
  }

  return paginatedResults;
};

const getAttendanceById = async (id, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  let query = TeacherAttendance.findOne({ _id: id, schoolId });

  if (populateOptionsStr) {
    populateOptionsStr.split(',').forEach((populateOption) => {
      const parts = populateOption.split(':');
      let path = parts[0].trim();
      let select = parts.length > 1 ? parts.slice(1).join(':').trim() : '';
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

const updateAttendanceById = async (attendanceId, updateBody, schoolId, updatedByUserId) => {
  const attendance = await getAttendanceById(attendanceId, schoolId);

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of an attendance record.');
  }
  delete updateBody.schoolId;

  Object.assign(attendance, updateBody, { markedBy: updatedByUserId });
  await attendance.save();
  return attendance;
};

const deleteAttendanceById = async (attendanceId, schoolId) => {
  const attendance = await getAttendanceById(attendanceId, schoolId);
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

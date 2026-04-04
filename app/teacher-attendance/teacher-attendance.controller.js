const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const teacherAttendanceService = require('./teacher-attendance.service');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');

const markAttendanceHandler = catchAsync(async (req, res) => {
  const markedByUserId = req.user.id;
  let schoolId = req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  const finalSchoolId = req.user.role === 'rootUser' ? req.body.schoolIdForAttendance : schoolId;
  if (!finalSchoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be specified for this operation.');
  }

  const attendance = await teacherAttendanceService.markSingleAttendance(req.body, finalSchoolId, markedByUserId);
  res.status(httpStatus.CREATED).send(attendance);
});

const markBulkAttendanceHandler = catchAsync(async (req, res) => {
  const markedByUserId = req.user.id;
  let schoolId = req.schoolId;
  const finalSchoolId = req.user.role === 'rootUser' ? req.body.schoolIdForAttendance : schoolId;
  if (!finalSchoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be specified for this operation.');
  }

  const results = await teacherAttendanceService.markBulkAttendance(req.body, finalSchoolId, markedByUserId);

  if (results.errors.length > 0 && results.success.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'All attendance records failed to process.',
      errors: results.errors,
      success: results.success,
    });
  } else if (results.errors.length > 0) {
    return res.status(httpStatus.PARTIAL_CONTENT).send({
      message: 'Some attendance records were processed successfully, while others failed.',
      errors: results.errors,
      success: results.success,
    });
  }
  res.status(httpStatus.CREATED).send({
    message: 'All attendance records processed successfully.',
    success: results.success,
    errors: results.errors,
  });
});

const getAttendancesHandler = catchAsync(async (req, res) => {
  let filter = pick(req.query, ['teacherId', 'branchId', 'date', 'status', 'markedBy', 'startDate', 'endDate']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  let schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId && !filter.teacherId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list attendance if not filtering by a specific teacher.');
  }

  if (req.user.role === 'teacher') {
    if (!req.user.schoolId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Teacher user is not properly associated with a school. Cannot fetch attendance.');
    }
    filter.teacherId = req.user.id;
    if (schoolId && schoolId != req.schoolId.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Teachers can only view attendance for their own school.');
    }
  } else if (req.user.role !== 'rootUser' && !schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for this role to list attendance.');
  }
  if (mongoose.Types.ObjectId.isValid(schoolId)) {
    schoolId = mongoose.Types.ObjectId(schoolId);
  }
  const result = await teacherAttendanceService.queryAttendances(filter, options, schoolId);
  res.send(result);
});

const getAttendanceHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to get specific attendance.');
  }

  const attendance = await teacherAttendanceService.getAttendanceById(req.params.attendanceId, schoolId, populateOptions);
  res.send(attendance);
});

const updateAttendanceHandler = catchAsync(async (req, res) => {
  const updatedByUserId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating attendance.');
  }

  const attendance = await teacherAttendanceService.updateAttendanceById(req.params.attendanceId, req.body, schoolId, updatedByUserId);
  res.send(attendance);
});

const deleteAttendanceHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when deleting attendance.');
  }

  await teacherAttendanceService.deleteAttendanceById(req.params.attendanceId, schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  markAttendanceHandler,
  markBulkAttendanceHandler,
  getAttendancesHandler,
  getAttendanceHandler,
  updateAttendanceHandler,
  deleteAttendanceHandler,
};

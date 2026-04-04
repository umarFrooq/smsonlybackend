const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const teacherAttendanceService = require('./teacherAttendance.service');

const createTeacherAttendance = catchAsync(async (req, res) => {
  const markedByUserId = req.user.id;
  const teacherAttendance = await teacherAttendanceService.createTeacherAttendance(req.body, markedByUserId);
  res.status(httpStatus.CREATED).send(teacherAttendance);
});

const getTeacherAttendances = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['teacher', 'date', 'status', 'branch']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await teacherAttendanceService.queryTeacherAttendances(filter, options);
  res.send(result);
});

const getTeacherAttendance = catchAsync(async (req, res) => {
  const teacherAttendance = await teacherAttendanceService.getTeacherAttendanceById(req.params.teacherAttendanceId);
  if (!teacherAttendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Teacher attendance not found');
  }
  res.send(teacherAttendance);
});

const updateTeacherAttendance = catchAsync(async (req, res) => {
  const teacherAttendance = await teacherAttendanceService.updateTeacherAttendanceById(
    req.params.teacherAttendanceId,
    req.body
  );
  res.send(teacherAttendance);
});

const deleteTeacherAttendance = catchAsync(async (req, res) => {
  await teacherAttendanceService.deleteTeacherAttendanceById(req.params.teacherAttendanceId);
  res.status(httpStatus.NO_CONTENT).send();
});

const bulkCreateTeacherAttendance = catchAsync(async (req, res) => {
  const markedByUserId = req.user.id;
  const results = await teacherAttendanceService.createBulkTeacherAttendances(req.body, markedByUserId);

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

const getUnmarkedTeachersForAttendance = catchAsync(async (req, res) => {
  const { schoolId, branchId, date } = req.query;
  const unmarkedTeachers = await teacherAttendanceService.getUnmarkedTeachers(schoolId, branchId, date);
  res.send(unmarkedTeachers);
});

module.exports = {
  createTeacherAttendance,
  getTeacherAttendances,
  getTeacherAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
  bulkCreateTeacherAttendance,
  getUnmarkedTeachersForAttendance,
};

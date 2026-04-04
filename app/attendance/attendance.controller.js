const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  attendanceService  = require('./attendance.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose')
const markAttendanceHandler = catchAsync(async (req, res) => {
  const markedByUserId = req.user.id;
  let schoolId = req.schoolId; // From schoolScopeMiddleware
  if (!schoolId && req.user.role !== 'rootUser') { // rootUser might need to specify schoolId in body if they can mark attendance
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  // If rootUser, schoolId for marking attendance should come from req.body or be inferred (e.g. via studentId's school)
  // For now, service expects schoolId explicitly if a non-root user is calling.
  // The service will validate entities against this schoolId.
  const finalSchoolId = req.user.role === 'rootUser' ? req.body.schoolIdForAttendance : schoolId;
   if (!finalSchoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be specified for this operation.');
  }

  const attendance = await attendanceService.markSingleAttcdendance(req.body, finalSchoolId, markedByUserId);
  res.status(httpStatus.CREATED).send(attendance);
});

const markBulkAttendanceHandler = catchAsync(async (req, res) => {
  const markedByUserId = req.user.id;
  let schoolId = req.schoolId;
  const finalSchoolId = req.user.role === 'rootUser' ? req.body.schoolIdForAttendance : schoolId;
   if (!finalSchoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be specified for this operation.');
  }

  const results = await attendanceService.markBulkAttendance(req.body, finalSchoolId, markedByUserId);
  
  // Determine overall status based on results
  if (results.errors.length > 0 && results.success.length === 0) {
    // If all entries failed
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'All attendance records failed to process.',
      errors: results.errors,
      success: results.success,
    });
  } else if (results.errors.length > 0) {
    // If some entries failed (partial success)
    return res.status(httpStatus.PARTIAL_CONTENT).send({ // 206 Partial Content or 207 Multi-Status
      message: 'Some attendance records were processed successfully, while others failed.',
      errors: results.errors,
      success: results.success,
    });
  }
  // All entries processed successfully
  res.status(httpStatus.CREATED).send({
      message: 'All attendance records processed successfully.',
      success: results.success,
      errors: results.errors, // Should be empty here
  });
});

const getAttendancesHandler = catchAsync(async (req, res) => {
  let filter = pick(req.query, ['studentId', 'subjectId', 'gradeId', 'section', 'branchId', 'date', 'status', 'markedBy', 'teacherId', 'startDate', 'endDate']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  let schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;
console.log("school id",schoolId)
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId && !filter.studentId){ // Allow root user to query by studentId without schoolId if studentId is provided
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list attendance if not filtering by a specific student.');
  }

  // If the user is a student, force the studentId filter to their own ID
  if (req.user.role === 'student') {
    if (!req.user.schoolId) {
      // This check ensures that the student user record has a schoolId.
      // The schoolScopeMiddleware should populate req.schoolId if user.schoolId exists.
      // If it's not here, it implies a data issue with the student's record.
      throw new ApiError(httpStatus.BAD_REQUEST, 'Student user is not properly associated with a school. Cannot fetch attendance.');
    }
    // if (filter.studentId && filter.studentId !== req.user.id) {
    //   // If a student tries to query for another student's ID, return forbidden
    //   throw new ApiError(httpStatus.FORBIDDEN, 'Students can only view their own attendance.');
    // }
    filter.studentId = req.user.id;
    // Also ensure they are querying within their school context. 'schoolId' is from query, 'req.schoolId' from middleware.
    // For students, 'schoolId' from query should ideally not be used or should match req.schoolId.
    // The primary school context for a student comes from req.schoolId.
    if (schoolId && schoolId != req.schoolId.toString()){ // schoolId is from req.query.schoolId (if provided)
        throw new ApiError(httpStatus.FORBIDDEN, 'Students can only view attendance for their own school.');
    }
    //  filter.schoolId = req.schoolId; // Ensure student queries are scoped to their school (from middleware)
  } else if (req.user.role !== 'rootUser' && !schoolId) { // schoolId here is from req.query.schoolId for admin/teacher type roles
    // For non-root, non-student users, schoolId must be provided in the query if not available from a default scope (e.g. if req.schoolId was not set by middleware)
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for this role to list attendance.');
  }
  if (mongoose.Types.ObjectId.isValid(schoolId)) {
    schoolId = mongoose.Types.ObjectId(schoolId);
  }
  // Remove the line that forces studentId to the current user's ID
  // filter.studentId=mongoose.Types.ObjectId(req.user.id)
  const result = await attendanceService.queryAttendances(filter, options, schoolId);
  res.send(result);
});

const getAttendanceHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
   if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to get specific attendance.');
  }

  const attendance = await attendanceService.getAttendanceById(req.params.attendanceId, schoolId, populateOptions);
  // Service handles 404 if not found in scope
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

  const attendance = await attendanceService.updateAttendanceById(req.params.attendanceId, req.body, schoolId, updatedByUserId);
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

  await attendanceService.deleteAttendanceById(req.params.attendanceId, schoolId);
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

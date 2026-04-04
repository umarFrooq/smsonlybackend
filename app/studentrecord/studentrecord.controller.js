const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { studentRecordService } = require('.'); // Assuming service is exported from index.js
const pick = require('../../utils/pick'); // For picking query params for options
const ApiError = require('../../utils/ApiError');

const getStudentRecordHandler = catchAsync(async (req, res) => {
  // Options for the service can be picked from query parameters
  const options = pick(req.query, [
      'populateUser', 
      'populateTestResults', 
      'attendanceStartDate', 
      'attendanceEndDate'
    ]);

  // Potentially add authorization logic here or in the service based on req.user
  // For example, if req.user.role === 'student' and req.user.id !== req.params.studentId, throw ApiError.
  // This is a simplified example; real-world auth would be more complex.
  if (req.user.role === 'student' && req.user.id.toString() !== req.params.studentId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Students can only view their own records.');
  }
  // Add similar checks for teachers (e.g., is this student in their class?) if an enrollment module existed.

  const schoolId = req.user.role !== 'rootUser' ? req.user.schoolId : undefined;
  const studentRecord = await studentRecordService.getStudentRecordById(req.params.studentId, options, schoolId);
  
  if (!studentRecord) { // Though service throws error, this is a safeguard.
    throw new ApiError(httpStatus.NOT_FOUND, 'Student record not found.');
  }
  res.send(studentRecord);
});

module.exports = {
  getStudentRecordHandler,
};

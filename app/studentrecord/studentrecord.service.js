const httpStatus = require('http-status');
const User = require('../user/user.model'); // Using direct path
const Attendance = require('../attendance/attendance.model'); // Using direct path
const TestResult = require('../testresult/testresult.model'); // Using direct path
// Address and Branch models are populated from User, so direct import not strictly needed here unless for other reasons
const ApiError = require('../../utils/ApiError');

/**
 * Get comprehensive student record by ID
 * @param {ObjectId} studentId
 * @param {Object} options - Options for populating and filtering related data
 * @param {string} [options.populateUser='permanentAddress,currentAddress,branch'] - Fields to populate on the User object
 * @param {string} [options.populateTestResults='testId'] - Fields to populate on TestResult objects
 * @param {Date} [options.attendanceStartDate] - Start date for attendance records
 * @param {Date} [options.attendanceEndDate] - End date for attendance records
 * @param {ObjectId} [schoolId] - School ID for scoping
 * @returns {Promise<Object>}
 */
const getStudentRecordById = async (studentId, options = {}, schoolId) => {
  const { 
    populateUser = 'permanentAddress currentAddress branch', 
    populateTestResults = 'testId',
    attendanceStartDate,
    attendanceEndDate 
  } = options;

  const filter = { _id: studentId };
  if (schoolId) filter.schoolId = schoolId;
  const user = await User.findOne(filter).populate(populateUser.split(',').map(field => field.trim()));

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }
  // Ensure the user is a student (or relevant role)
  if (!['student', 'user'].includes(user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Requested user is not a student.');
  }

  // Fetch Attendance Records
  const attendanceQuery = { studentId };
  if (attendanceStartDate && attendanceEndDate) {
    attendanceQuery.date = { $gte: new Date(attendanceStartDate), $lte: new Date(attendanceEndDate) };
  } else if (attendanceStartDate) {
    attendanceQuery.date = { $gte: new Date(attendanceStartDate) };
  } else if (attendanceEndDate) {
    attendanceQuery.date = { $lte: new Date(attendanceEndDate) };
  }
  // For now, fetch all matching attendance records. Summarization can be added later.
  const attendanceRecords = await Attendance.find(attendanceQuery)
    .populate('subjectId', 'title subjectCode') // Populate subject details
    .sort({ date: -1 }); // Sort by most recent

  // Fetch Test Results
  const testResults = await TestResult.find({ studentId })
    .populate(populateTestResults.split(',').map(field => ({ path: field.trim(), select: 'title totalMarks date' }))) // Populate specified fields of testId by default
    .sort({ 'testId.date': -1, createdAt: -1 }); // Sort by test date, then creation

  // Placeholder for assigned subjects (requires Enrollment module)
  const assignedSubjects = []; // e.g., fetch from Enrollment.find({ studentId }).populate('subjectId courseId')

  // Placeholder for grade details (requires Enrollment module or link on User)
  const gradeDetails = null; // e.g., fetch from Enrollment.findOne({ studentId, active: true }).populate('gradeId section')

  return {
    user: user.toJSON(), // Use toJSON to apply plugins like virtuals if any
    attendanceRecords,
    testResults,
    assignedSubjects, // To be implemented with Enrollment module
    gradeDetails,     // To be implemented with Enrollment module
  };
};

module.exports = {
  getStudentRecordById,
};

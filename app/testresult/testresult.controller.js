const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  testResultService  = require('./testresult.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createTestResultHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForResult : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolIdForResult) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID (schoolIdForResult) must be provided in body for root users.');
  }
  // Service will validate testId, studentId against this schoolId.
  const testResult = await testResultService.createTestResult(req.body, schoolId, userId, req.files);
  res.status(httpStatus.CREATED).send(testResult);
});

const getTestResultsHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['testId', 'studentId', 'gradeId', 'branchId', 'markedBy', 'minObtainedMarks', 'maxObtainedMarks']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  let schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (req.user.role === 'student' && (!filter.studentId || filter.studentId !== req.user.id.toString())) {
      filter.studentId = req.user.id.toString(); // Students see their own results
  }

  if (!schoolId && req.user.role !== 'rootUser' && req.user.role !== 'student') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list test results.');
  }

  const result = await testResultService.queryTestResults(filter, options, schoolId);
  res.send(result);
});

const getTestResultHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  let schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser' && req.user.role !== 'student') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users.');
  }

  const testResult = await testResultService.getTestResultById(req.params.resultId, schoolId, populateOptions);

  if (req.user.role === 'student' && testResult.studentId.toString() !== req.user.id.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to view this test result.');
  }
  // Service handles 404 if not found in scope
  res.send(testResult);
});

const updateTestResultHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating a test result.');
  }

  const testResult = await testResultService.updateTestResultById(
    req.params.resultId,
    req.body,
    schoolId, // Pass schoolId
    userId,
    req.files
  );
  res.send(testResult);
});

const deleteTestResultHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when deleting a test result.');
  }
  await testResultService.deleteTestResultById(req.params.resultId, schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTestResultHandler,
  getTestResultsHandler,
  getTestResultHandler,
  updateTestResultHandler,
  deleteTestResultHandler,
};

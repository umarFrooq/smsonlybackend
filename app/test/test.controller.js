const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  testService  = require('./test.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createTestHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForTest : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolIdForTest) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID (schoolIdForTest) must be provided in body for root users.');
  }
  // Service will validate subjectId, gradeId, branchId in req.body against this schoolId.
  const test = await testService.createTest(req.body, schoolId, userId);
  res.status(httpStatus.CREATED).send(test);
});

const getTestsHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'subjectId', 'gradeId', 'section', 'branchId', 'date', 'startDate', 'endDate', 'createdBy']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list tests.');
  }

  const result = await testService.queryTests(filter, options, schoolId);
  res.send(result);
});

const getTestHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to get a specific test.');
  }

  const test = await testService.getTestById(req.params.testId, schoolId, populateOptions);
  // Service handles 404
  res.send(test);
});

const updateTestHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating a test.');
  }
  // userId for 'updatedBy' could be passed to service if needed.
  const test = await testService.updateTestById(req.params.testId, req.body, schoolId);
  res.send(test);
});

const deleteTestHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when deleting a test.');
  }
  await testService.deleteTestById(req.params.testId, schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTestHandler,
  getTestsHandler,
  getTestHandler,
  updateTestHandler,
  deleteTestHandler,
};

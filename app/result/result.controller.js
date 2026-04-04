const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const resultService = require('./result.service');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createResult = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForResult : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolIdForResult) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID (schoolIdForResult) must be provided in body for root users.');
  }
  const result = await resultService.createResult(req.body, schoolId, req.user);
  res.status(httpStatus.CREATED).send(result);
});

const getResults = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['examId', 'studentId', 'subjectId', 'gradeId', 'branchId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  let schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (req.user.role === 'student' && (!filter.studentId || filter.studentId !== req.user.id.toString())) {
    filter.studentId = req.user.id.toString(); // Students see their own results
  }

  if (!schoolId && req.user.role !== 'rootUser' && req.user.role !== 'student') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list results.');
  }

  const result = await resultService.queryResults(filter, options, schoolId, req.user);
  res.send(result);
});

const getResult = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  let schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser' && req.user.role !== 'student') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users.');
  }

  const result = await resultService.getResultById(req.params.resultId, schoolId, populateOptions);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Result not found');
  }

  if (req.user.role === 'student' && result.studentId.toString() !== req.user.id.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to view this result.');
  }

  // Students cannot view results that have not been announced
  if (req.user.role === 'student' && result.status !== 'announced') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Result has not been announced yet.');
  }

  res.send(result);
});

const updateResult = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating a result.');
  }

  const result = await resultService.updateResultById(req.params.resultId, req.body, schoolId, req.user);
  res.send(result);
});

const deleteResult = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when deleting a result.');
  }
  await resultService.deleteResultById(req.params.resultId, schoolId, req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

const bulkUpdateResults = catchAsync(async (req, res) => {
    const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForResult || req.query.schoolId : req.schoolId;
    if (!schoolId && req.user.role !== 'rootUser') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for bulk update.');
    }
    if (!schoolId && req.user.role === 'rootUser') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided for root users when performing bulk updates.');
    }
    const results = await resultService.bulkUpdateResults(req.body, schoolId, req.user);
    res.status(httpStatus.OK).send(results);
});

const announceResults = catchAsync(async (req, res) => {
  const payload = req.body || {};
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForResult || req.query.schoolId : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for announcing results.');
  }
  const results = await resultService.announceResults(payload, schoolId, req.user);
  res.status(httpStatus.OK).send(results);
});

module.exports = {
    createResult,
    getResults,
    getResult,
    updateResult,
    deleteResult,
    bulkUpdateResults,
  announceResults,
};

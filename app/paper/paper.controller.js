const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { paperService } = require('./paper.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const uploadPaperHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForPaper : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolIdForPaper) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID (schoolIdForPaper) must be provided in body for root users.');
  }

  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Paper file is required.');
  }
  const fileUrl = req.file.key;

  const paper = await paperService.uploadPaper(req.body, schoolId, userId, fileUrl);
  res.status(httpStatus.CREATED).send(paper);
});

const getPapersHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'subjectId', 'gradeId', 'branchId', 'year', 'type', 'uploadedBy']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list papers.');
  }

  const result = await paperService.queryPapers(filter, options, schoolId);
  res.send(result);
});

const getPaperHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to get a specific paper.');
  }

  const paper = await paperService.getPaperById(req.params.paperId, schoolId, populateOptions);
  // Service handles 404
  res.send(paper);
});

const updatePaperHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating a paper.');
  }

  const newFileUrl = req.file ? req.file.key : undefined;

  const paper = await paperService.updatePaperById(
    req.params.paperId,
    req.body,
    schoolId, // Pass schoolId to service
    userId,
    newFileUrl
  );
  res.send(paper);
});

const deletePaperHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when deleting a paper.');
  }

  await paperService.deletePaperById(req.params.paperId, schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  uploadPaperHandler,
  getPapersHandler,
  getPaperHandler,
  updatePaperHandler,
  deletePaperHandler,
};

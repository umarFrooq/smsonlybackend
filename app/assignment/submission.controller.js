const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { submissionService } = require('./index'); // Assuming services will be exported via index.js


const getSubmissionsHandler = catchAsync(async (req, res) => {
  const filterParams = pick(req.query, [
    'assignmentId', 'studentId', 'status',
    'schoolId', 'gradeId' // For admin/rootUser filtering
  ]);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  // If the user is a student and tries to query by a different studentId, override or error.
  if (req.user.role === 'student' && filterParams.studentId && filterParams.studentId !== req.user._id.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, "You can only view your own submissions.");
  }
  // If student is querying without studentId, service will scope to their ID.

  const result = await submissionService.querySubmissions(filterParams, options, req.user);
  res.send(result);
});

const getSubmissionHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const submission = await submissionService.getSubmissionById(req.params.submissionId, req.user, populateOptions);
  res.send(submission);
});

const gradeSubmissionHandler = catchAsync(async (req, res) => {
  // Typically, only teachers or admins should grade.
  if (!['teacher', 'admin', 'rootUser'].includes(req.user.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to grade submissions.');
  }
  const { submissionId } = req.params;
  const submission = await submissionService.gradeSubmissionById(submissionId, req.body, req.user);
  res.send(submission);
});

const updateSubmissionHandler = catchAsync(async (req, res) => {
    const { submissionId } = req.params;
    const submission = await submissionService.updateSubmissionById(submissionId, req.body, req.user);
    res.send(submission);
});

module.exports = {
  getSubmissionsHandler,
  getSubmissionHandler,
  gradeSubmissionHandler,
  updateSubmissionHandler,
};

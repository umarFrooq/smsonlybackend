const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { assignmentService } = require('./index'); // Assuming services will be exported via index.js

const createAssignmentHandler = catchAsync(async (req, res) => {
  const schoolIdForRoot = req.user.role === 'rootUser' ? req.body.schoolId : null;
  if (req.user.role === 'rootUser' && !req.body.schoolId) {
    // If allowing rootUser to create for any school, schoolId must be in body.
    // For now, let's assume rootUser doesn't typically create assignments directly,
    // or if they do, they specify the school.
    // This logic can be adjusted based on how rootUser interaction is defined.
    // For now, this implies rootUser must provide schoolId if they are creating.
    // However, the service expects schoolIdForRoot, which can be null if not provided,
    // and then the service should handle it.
    // Let's refine: if rootUser, schoolId in body is the target. If not provided, error.
    // if (req.user.role === 'rootUser' && !req.body.schoolIdForAssignment) {
    //   throw new ApiError(httpStatus.BAD_REQUEST, 'rootUser must specify schoolIdForAssignment in the body.');
    // }
    // const schoolIdForCreation = req.user.role === 'rootUser' ? req.body.schoolIdForAssignment : req.user.schoolId;
  }
  // teacherId is derived from req.user in the service
  // schoolId is also derived from req.user (for non-root) or passed for root in service
  const assignment = await assignmentService.createAssignment(req.body, req.user, schoolIdForRoot);
  res.status(httpStatus.CREATED).send(assignment);
});

const getAssignmentsHandler = catchAsync(async (req, res) => {
  const filterParams = pick(req.query, [
    'title', 'subjectId', 'gradeId', 'branchId', 'teacherId',
    'dueDateFrom', 'dueDateTo', 'status', 'schoolId' // schoolId for rootUser filter
  ]);
  // If student is making the request, add their ID to filter criteria for service layer
  if (req.user.role === 'student') {
      filterParams.studentId = req.user._id; // Service will use this to fetch student's grade etc.
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  const result = await assignmentService.queryAssignments(filterParams, options, req.user);
  res.send(result);
});

const getAssignmentHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const assignment = await assignmentService.getAssignmentById(req.params.assignmentId, req.user, populateOptions);
  res.send(assignment);
});

const updateAssignmentHandler = catchAsync(async (req, res) => {
  // Only teachers can update their assignments. Admins might have different routes or logic.
  if (req.user.role !== 'teacher' && req.user.role !== 'admin' && req.user.role !== 'rootUser') { // Added admin/rootUser for potential broader update capabilities
      // throw new ApiError(httpStatus.FORBIDDEN, 'Only teachers can update assignments directly.');
      // Service layer will enforce specific ownership/permissions
  }
  const assignment = await assignmentService.updateAssignmentById(req.params.assignmentId, req.body, req.user);
  res.send(assignment);
});

const deleteAssignmentHandler = catchAsync(async (req, res) => {
  // Similar to update, primarily for teachers, but service handles actual permission.
  await assignmentService.deleteAssignmentById(req.params.assignmentId, req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createAssignmentHandler,
  getAssignmentsHandler,
  getAssignmentHandler,
  updateAssignmentHandler,
  deleteAssignmentHandler,
};

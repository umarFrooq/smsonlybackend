const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  branchService  = require('./branch.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createBranchHandler = catchAsync(async (req, res) => {
  // req.schoolId is populated by schoolScopeMiddleware for scoped users (e.g. superadmin)
  // For rootUser, req.schoolId might be undefined.
  // The service layer's createBranch now expects schoolId.
  // If the creator is rootUser, schoolId must be in req.body. If superadmin, it's from req.schoolId.
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolId : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') { // Superadmin must have a schoolId from context
      throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolId){ // Root user must specify schoolId in body
      throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in the request body for root users.');
  }

  const branch = await branchService.createBranch(req.body, schoolId);
  res.status(httpStatus.CREATED).send(branch);
});

const getBranchesHandler = catchAsync(async (req, res) => {
  // Updated to pick 'search', 'status', 'type', and 'schoolId' (for rootUser)
  const filter = pick(req.query, ['search', 'status', 'type', 'schoolId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  let schoolIdForService = req.query.schoolId; // For rootUser to specify a school

  if (req.user.role !== 'rootUser') { // For non-root users (e.g., superadmin)
    schoolIdForService = req.schoolId; // Must use their own schoolId from context
    if (!schoolIdForService) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role and is missing.');
    }
    // Remove schoolId from filter if it was picked from query, as service will use context schoolId
    delete filter.schoolId;
  }
  // If user is rootUser, schoolIdForService can be undefined (service lists all if filter.schoolId is also undefined)
  // or a specific ID from query (which is already in filter.schoolId and will be passed as schoolIdForService).
  // If filter.schoolId exists (from rootUser query), it will be used by service.
  // If not, and schoolIdForService (from context for superadmin) exists, that's used.

  const result = await branchService.queryBranches(filter, options, schoolIdForService, req.user.role);
  res.send(result);
});

const getBranchHandler = catchAsync(async (req, res) => {
  let schoolIdForService = req.query.schoolId; // rootUser can specify schoolId in query

  if (req.user.role !== 'rootUser') {
    schoolIdForService = req.schoolId;
    if (!schoolIdForService) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role and is missing.');
    }
  }
  // For rootUser, schoolIdForService can be undefined (service will fetch any branch by ID) or specific.
  // For superadmin, schoolIdForService is their req.schoolId.
  const populateOptions = req.query.populate; // Get populate from query for getBranchById

  const branch = await branchService.getBranchById(req.params.branchId, schoolIdForService, req.user.role, populateOptions);
  res.send(branch);
});

const updateBranchHandler = catchAsync(async (req, res) => {
  // For update/delete, rootUser MUST specify which school's branch they are targeting if not using their own schoolId.
  // Scoped users (superadmin) will use their req.schoolId.
  let schoolIdForOperation = req.user.role === 'rootUser' ? (req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo) : req.schoolId;

  if (!schoolIdForOperation) {
      const message = req.user.role === 'rootUser'
          ? 'School ID (schoolIdToScopeTo in body/query) must be provided for root user to update a branch.'
          : 'School context is required for your role and is missing.';
      throw new ApiError(httpStatus.BAD_REQUEST, message);
  }

  const branch = await branchService.updateBranchById(req.params.branchId, req.body, schoolIdForOperation);
  res.send(branch);
});

const deleteBranchHandler = catchAsync(async (req, res) => {
  let schoolIdForOperation = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;

  if (!schoolIdForOperation) {
      const message = req.user.role === 'rootUser'
          ? 'School ID (schoolIdToScopeTo in query) must be provided for root user to delete a branch.'
          : 'School context is required for your role and is missing.';
      throw new ApiError(httpStatus.BAD_REQUEST, message);
  }

  await branchService.deleteBranchById(req.params.branchId, schoolIdForOperation);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createBranchHandler,
  getBranchesHandler,
  getBranchHandler,
  updateBranchHandler,
  deleteBranchHandler,
};

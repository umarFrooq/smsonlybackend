const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  gradeService  = require('./grade.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createGradeHandler = catchAsync(async (req, res) => {
  // If creator is rootUser, schoolId must be in req.body.branchId (as branch implies school).
  // Or, schoolId directly in req.body if grades can be independent of branches (current model ties grade to branch).
  // The service now expects schoolId as a direct param.
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForGrade : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolIdForGrade) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID (schoolIdForGrade) must be provided in the request body for root users.');
  }
  // branchId in req.body will be validated by service to belong to schoolId

  const grade = await gradeService.createGrade(req.body, schoolId);
  res.status(httpStatus.CREATED).send(grade);
});

const getGradesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'levelCode', 'branchId']); // branchId here could be used by rootUser to filter
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list grades.');
  }
  // If rootUser provides a branchId in filter, the service should ensure that branch belongs to the queried schoolId.
  // Or, the service could allow rootUser to list all grades if schoolId is omitted (current service requires schoolId).

  const result = await gradeService.queryGrades(filter, options, schoolId, req.user.role); // Pass userRole
  res.send(result);
});

const getGradeHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') { // Non-root users must have a schoolId from context
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  // For rootUser, schoolId can be undefined if they want to get any grade by ID, or they can specify it.
  // The service's getGradeById now handles this with userRole.
  if (!schoolId && req.user.role === 'rootUser' && req.query.schoolId) { // If rootUser explicitly passed schoolId in query
     schoolId = req.query.schoolId;
  } else if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
    // If root user and no schoolId in query, pass undefined to service for global get by ID
    schoolId = undefined;
  }


  const grade = await gradeService.getGradeById(req.params.gradeId, schoolId, req.user.role, populateOptions); // Pass userRole
  // Service already throws 404 if not found in scope (when schoolId is provided)
  res.send(grade);
});

const updateGradeHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating a grade.');
  }

  const grade = await gradeService.updateGradeById(req.params.gradeId, req.body, schoolId, req.user.role);
  res.send(grade);
});

const deleteGradeHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
   if (!schoolId && req.user.role === 'rootUser'){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when deleting a grade.');
  }

  await gradeService.deleteGradeById(req.params.gradeId, schoolId, req.user.role);
  res.status(httpStatus.NO_CONTENT).send();
});

const addSectionHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId) { throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope is required.');}
  const grade = await gradeService.addSectionToGrade(req.params.gradeId, req.body.sectionName, schoolId, req.user.role);
  res.send(grade);
});

const removeSectionHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
   if (!schoolId) { throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope is required.');}
  const grade = await gradeService.removeSectionFromGrade(req.params.gradeId, req.params.sectionName, schoolId, req.user.role);
  res.send(grade);
});

const updateSectionsHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId) { throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope is required.');}
  const grade = await gradeService.updateSectionsInGrade(req.params.gradeId, req.body.sections, schoolId, req.user.role);
  res.send(grade);
});

module.exports = {
  createGradeHandler,
  getGradesHandler,
  getGradeHandler,
  updateGradeHandler,
  deleteGradeHandler,
  addSectionHandler,
  removeSectionHandler,
  updateSectionsHandler,
};

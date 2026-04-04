const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { fineService } = require('.'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const issueFineHandler = catchAsync(async (req, res) => {
  const issuedByUserId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForFine : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolIdForFine) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID (schoolIdForFine) must be provided in body for root users.');
  }
  // Service will validate studentId, branchId in req.body against this schoolId.
  const fine = await fineService.issueFine(req.body, schoolId, issuedByUserId);
  res.status(httpStatus.CREATED).send(fine);
});

const getFinesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['studentId', 'branchId', 'type', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  let schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (req.user.role === 'student' && (!filter.studentId || filter.studentId !== req.user.id.toString())) {
      filter.studentId = req.user.id.toString();
  }

  if (!schoolId && req.user.role !== 'rootUser' && req.user.role !== 'student') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list fines.');
  }

  const result = await fineService.queryFines(filter, options, schoolId);
  res.send(result);
});

const getFineHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  let schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser' && req.user.role !== 'student') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users.');
  }

  const fine = await fineService.getFineById(req.params.fineId, schoolId, populateOptions);

  if (req.user.role === 'student' && fine.studentId.toString() !== req.user.id.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to view this fine record.');
  }
  // Service already throws 404 if not found in scope.
  res.send(fine);
});

const updateFineStatusHandler = catchAsync(async (req, res) => {
  const updatedByUserId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating a fine status.');
  }

  const fine = await fineService.updateFineStatus(req.params.fineId, req.body, schoolId, updatedByUserId);
  res.send(fine);
});

module.exports = {
  issueFineHandler,
  getFinesHandler,
  getFineHandler,
  updateFineStatusHandler,
};

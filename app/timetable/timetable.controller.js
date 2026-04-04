const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  timetableService  = require('./timetable.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createTimetableHandler = catchAsync(async (req, res) => {
  const createdByUserId = req.user.id; // Or however createdBy is determined
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForTimetable : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolIdForTimetable) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID (schoolIdForTimetable) must be provided in body for root users.');
  }
  // Service will validate gradeId, branchId etc. against this schoolId
  const timetable = await timetableService.createTimetable(req.body, schoolId, createdByUserId);
  res.status(httpStatus.CREATED).send(timetable);
});

const getTimetablesHandler = catchAsync(async (req, res) => { // General query
  const filter = pick(req.query, ['gradeId', 'section', 'branchId', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list timetables.');
  }
  
  const result = await timetableService.queryTimetables(filter, options, schoolId);
  res.send(result);
});

const getEffectiveTimetableHandler = catchAsync(async (req, res) => {
    const { gradeId, section, branchId, date } = req.query;
    const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdForEffective : req.schoolId; // schoolIdForEffective if root needs to specify

    if (!schoolId && req.user.role !== 'rootUser') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
    }
     if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolIdForEffective) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'School ID (schoolIdForEffective) must be provided in query for root users.');
    }
    if (!gradeId || !section || !branchId || !date) { // Basic check, validation handles specifics
        throw new ApiError(httpStatus.BAD_REQUEST, 'gradeId, section, branchId, and date are required for effective timetable.');
    }

    const result = await timetableService.getEffectiveTimetable(schoolId, gradeId, section, branchId, new Date(date));
    if (!result) {
        return res.send({}); // Send empty object if no effective timetable found
    }
    res.send(result);
});


const getTimetableHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users.');
  }

  const timetable = await timetableService.getTimetableById(req.params.timetableId, schoolId, populateOptions);
  // Service handles 404
  res.send(timetable);
});

const updateTimetableHandler = catchAsync(async (req, res) => {
  const updatedByUserId = req.user.id; // Or however updatedBy is determined
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating a timetable.');
  }

  const timetable = await timetableService.updateTimetableById(req.params.timetableId, req.body, schoolId, updatedByUserId);
  res.send(timetable);
});

const deleteTimetableHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when deleting a timetable.');
  }
  await timetableService.deleteTimetableById(req.params.timetableId, schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTimetableHandler,
  getTimetablesHandler,
  getEffectiveTimetableHandler, // Export new handler
  getTimetableHandler,
  updateTimetableHandler,
  deleteTimetableHandler,
};

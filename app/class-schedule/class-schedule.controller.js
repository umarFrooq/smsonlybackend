const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { classScheduleService } = require('./index'); // Assuming service is exported via index.js
const { buildTimetablePDF } = require('./pdf.service');

const createClassScheduleHandler = catchAsync(async (req, res) => {
  // schoolId should be available from schoolScopeMiddleware or req.user for root users
  const schoolId = req.schoolId || (req.user.role === 'rootUser' ? req.body.schoolId : null);
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required and was not found.');
  }
  // Ensure the request body's schoolId matches the scoped schoolId (unless root user providing it)
  if (req.user.role !== 'rootUser' && req.body.schoolId && req.body.schoolId !== schoolId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You cannot create a schedule for a different school.');
  }

  const scheduleBodyWithSchool = { ...req.body, schoolId: req.body.schoolId || schoolId };

  const schedule = await classScheduleService.createClassSchedule(scheduleBodyWithSchool, req.user.id);
  // res.status(httpStatus.CREATED).send(schedule);
  res.status(httpStatus.CREATED).send({ success: true, data: schedule, message: 'Class Schedule created successfully' });
});

const getClassSchedulesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['schoolId', 'branchId', 'gradeId', 'section', 'subjectId', 'teacherId', 'dayOfWeek', 'startTime', 'endTime', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  // Apply school scoping
  if (req.user.role !== 'rootUser') {
    if (filter.schoolId && filter.schoolId !== req.schoolId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only query schedules for your assigned school.");
    }
    filter.schoolId = req.schoolId; // Enforce school scope
  } else {
     if (!filter.schoolId && !options.populate) { // Allow root user to query all if no schoolId provided, but it's better to require it for large datasets
        // Consider if root users should always provide a schoolId unless it's a global search
        // For now, if no schoolId, it queries all. This might need adjustment.
     }
  }
   if (!filter.schoolId && req.user.role !== 'rootUser') { // Double check for non-root users
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required for querying schedules.');
  }


  // Role-specific filtering logic
  if (req.user.role === 'student') {
    // Students can only see their own schedule based on their grade and section.
    // Override any query parameters with the user's actual grade and section.
    if (!req.user.gradeId || !req.user.section) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Your student profile does not have a grade or section assigned. Please ask your school administrator to update your profile.');
    }
    filter.gradeId = req.user.gradeId;
    filter.section = req.user.section;
  } else if (req.route.path === '/my-classes' && req.user.role === 'teacher') {
    // This is the specific endpoint for a teacher to get their own classes.
    filter.teacherId = req.user.id;
    if (!filter.schoolId) {
      filter.schoolId = req.schoolId; // Ensure teacher is scoped to their school
    }
    // Default population for my-classes might be useful
    if (!options.populate) {
      options.populate = 'subjectId,gradeId,branchId,schoolId';
    }
  }


  const result = await classScheduleService.queryClassSchedules(filter, options);
  // res.send(result); // Paginate plugin returns the full object with results, totalResults, etc.
  res.status(httpStatus.OK).send({ success: true, data: result });
});

const getClassScheduleHandler = catchAsync(async (req, res) => {
  let schoolIdForScope = null;
  if (req.user.role !== 'rootUser') {
    schoolIdForScope = req.schoolId;
  } else if (req.query.schoolId) { // Root user can specify schoolId for scoping
    schoolIdForScope = req.query.schoolId;
  }

  const populateOptions = req.query.populate;
  const schedule = await classScheduleService.getClassScheduleById(req.params.scheduleId, schoolIdForScope, populateOptions);
  // Service throws 404 if not found or not in scope (if schoolIdForScope was provided)
  // res.send(schedule);
  res.status(httpStatus.OK).send({ success: true, data: schedule });
});

const updateClassScheduleHandler = catchAsync(async (req, res) => {
  let schoolIdForScope = null;
  if (req.user.role !== 'rootUser') {
    schoolIdForScope = req.schoolId;
  } else if (req.body.schoolIdForScope) { // Allow root user to specify scope via body
    schoolIdForScope = req.body.schoolIdForScope;
  }
  // schoolId in body should not be changed directly by non-root, or if changed by root, must match scope.
  // The service handles preventing schoolId field changes directly.

  const schedule = await classScheduleService.updateClassScheduleById(req.params.scheduleId, req.body, req.user.id, schoolIdForScope);
  // res.send(schedule);
  res.status(httpStatus.OK).send({ success: true, data: schedule, message: 'Class Schedule updated successfully' });
});

const deleteClassScheduleHandler = catchAsync(async (req, res) => {
  let schoolIdForScope = null;
  if (req.user.role !== 'rootUser') {
    schoolIdForScope = req.schoolId;
  } else if (req.query.schoolIdForScope) { // Allow root user to specify scope via query
    schoolIdForScope = req.query.schoolIdForScope;
  }

  await classScheduleService.deleteClassScheduleById(req.params.scheduleId, schoolIdForScope);
  // res.status(httpStatus.NO_CONTENT).send();
  res.status(httpStatus.OK).send({ success: true, data: null, message: 'Class Schedule deleted successfully' });
});

const downloadClassSchedulesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['schoolId', 'branchId', 'gradeId', 'section', 'subjectId', 'teacherId', 'dayOfWeek', 'startTime', 'endTime', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  options.limit = 1000; // Get all records for PDF

  // Apply school scoping
  if (req.user.role !== 'rootUser') {
    if (filter.schoolId && filter.schoolId !== req.schoolId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only query schedules for your assigned school.");
    }
    filter.schoolId = req.schoolId; // Enforce school scope
  }

  // Role-specific filtering logic
  if (req.user.role === 'student') {
    if (!req.user.gradeId || !req.user.section) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Your student profile does not have a grade or section assigned. Please ask your school administrator to update your profile.');
    }
    filter.gradeId = req.user.gradeId;
    filter.section = req.user.section;
  } else if (req.user.role === 'teacher') {
    filter.teacherId = req.user.id;
  }

  const result = await classScheduleService.queryClassSchedules(filter, options);

  const stream = res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment;filename=timetable.pdf',
  });

  buildTimetablePDF(
    (chunk) => stream.write(chunk),
    () => stream.end(),
    result.results
  );
});

module.exports = {
  createClassScheduleHandler,
  getClassSchedulesHandler,
  getClassScheduleHandler,
  updateClassScheduleHandler,
  deleteClassScheduleHandler,
  downloadClassSchedulesHandler,
};

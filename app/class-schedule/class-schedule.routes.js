const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const classScheduleValidation = require('./class-schedule.validation');
const classScheduleController = require('./class-schedule.controller');
// Assuming you'll create an index.js in class-schedule folder to export controller and service

const router = express.Router();

// Permissions (to be added to config/roles.js and user roles)
const MANAGE_SCHEDULES = 'manageClassSchedules'; // For create, update, delete
const VIEW_SCHEDULES = 'viewClassSchedules';     // For listing all or getting one
const VIEW_OWN_SCHEDULE = 'viewOwnClassSchedule'; // For teachers to see their own

// Apply auth and school scope to all routes in this module
router.use(auth(), schoolScopeMiddleware); // schoolScopeMiddleware ensures req.schoolId is set

router
  .route('/')
  .post(
    auth(MANAGE_SCHEDULES),
    validate(classScheduleValidation.createClassSchedule),
    classScheduleController.createClassScheduleHandler
  )
  .get(
    auth(VIEW_SCHEDULES, 'viewOwnClassSchedule'),
    validate(classScheduleValidation.getClassSchedules),
    classScheduleController.getClassSchedulesHandler
  );

// Route for teachers to get their own class schedules
// This needs to be defined *before* the /:scheduleId route to avoid 'my-classes' being treated as an ID
router.get(
  '/my-classes',
  auth(VIEW_OWN_SCHEDULE), // Ensures only teachers with this permission can access
  validate(classScheduleValidation.getClassSchedules), // Uses the same validation as general GET
  classScheduleController.getClassSchedulesHandler // Controller logic will filter by req.user.id
);

router.route('/download').get(
  auth(VIEW_SCHEDULES),
  validate(classScheduleValidation.getClassSchedules), // Use same validation as listing
  classScheduleController.downloadClassSchedulesHandler
);

router
  .route('/:scheduleId')
  .get(
    // Allow users who have general view rights or those who can view their own schedule
    auth(VIEW_SCHEDULES, VIEW_OWN_SCHEDULE), // Users can view any if they have VIEW_SCHEDULES, or their own if they are a teacher and it's theirs
    validate(classScheduleValidation.getClassSchedule),
    classScheduleController.getClassScheduleHandler
  )
  .patch(
    auth(MANAGE_SCHEDULES),
    validate(classScheduleValidation.updateClassSchedule),
    classScheduleController.updateClassScheduleHandler
  )
  .delete(
    auth(MANAGE_SCHEDULES),
    validate(classScheduleValidation.deleteClassSchedule),
    classScheduleController.deleteClassScheduleHandler
  );

module.exports = router;

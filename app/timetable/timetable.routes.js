const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware'); // Import middleware
const timetableController = require('./timetable.controller');
const timetableValidations = require('./timetable.validations');

const router = express.Router();

// Define permissions
const manageTimetablesPermission = 'manageTimetables';
const viewTimetablesPermission = 'viewTimetables'; // Students, teachers might have this

// Apply auth and schoolScope middleware
router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .post(
    auth(manageTimetablesPermission),
    validate(timetableValidations.createTimetable),
    timetableController.createTimetableHandler
  )
  .get(
    auth(viewTimetablesPermission),
    validate(timetableValidations.getTimetables),
    timetableController.getTimetablesHandler
  );

// Specific route for effective timetable, as its query params are distinct
router
    .route('/effective')
    .get(
        auth(viewTimetablesPermission), // All school users might need to see effective timetable
        validate(timetableValidations.getEffectiveTimetable), // Specific validation for these params
        timetableController.getEffectiveTimetableHandler
    );


router
  .route('/:timetableId')
  .get(
    auth(viewTimetablesPermission),
    validate(timetableValidations.getTimetable),
    timetableController.getTimetableHandler
  )
  .patch(
    auth(manageTimetablesPermission),
    validate(timetableValidations.updateTimetable),
    timetableController.updateTimetableHandler
  )
  .delete(
    auth(manageTimetablesPermission),
    validate(timetableValidations.deleteTimetable),
    timetableController.deleteTimetableHandler
  );

module.exports = router;

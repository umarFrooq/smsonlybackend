const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware'); // Import middleware
const attendanceController = require('./attendance.controller');
const attendanceValidations = require('./attendance.validations');

const router = express.Router();

// Define permissions (should be added to config/roles.js for relevant roles)
const manageAttendancePermission = 'manageAttendances';
const viewAttendancePermission = 'viewAttendances';

// Apply auth and schoolScope middleware to all attendance routes
router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .get(auth(viewAttendancePermission), validate(attendanceValidations.getAttendances), attendanceController.getAttendancesHandler);

router
  .route('/single')
  .post(auth(manageAttendancePermission), validate(attendanceValidations.markAttendance), attendanceController.markAttendanceHandler);

router
  .route('/bulk')
  .post(auth(manageAttendancePermission), validate(attendanceValidations.markBulkAttendance), attendanceController.markBulkAttendanceHandler);

router
  .route('/:attendanceId')
  .get(auth(viewAttendancePermission), validate(attendanceValidations.getAttendance), attendanceController.getAttendanceHandler)
  .patch(auth(manageAttendancePermission), validate(attendanceValidations.updateAttendance), attendanceController.updateAttendanceHandler)
  .delete(auth(manageAttendancePermission), validate(attendanceValidations.deleteAttendance), attendanceController.deleteAttendanceHandler);

module.exports = router;

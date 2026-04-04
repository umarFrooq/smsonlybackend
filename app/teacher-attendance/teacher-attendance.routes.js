const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const teacherAttendanceController = require('./teacher-attendance.controller');
const teacherAttendanceValidations = require('./teacher-attendance.validations');

const router = express.Router();

const manageTeacherAttendances = 'manageTeacherAttendances';
const viewTeacherAttendances = 'viewTeacherAttendances';

router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .get(auth(viewTeacherAttendances), validate(teacherAttendanceValidations.getAttendances), teacherAttendanceController.getAttendancesHandler);

router
  .route('/single')
  .post(auth(manageTeacherAttendances), validate(teacherAttendanceValidations.markAttendance), teacherAttendanceController.markAttendanceHandler);

router
  .route('/bulk')
  .post(auth(manageTeacherAttendances), validate(teacherAttendanceValidations.markBulkAttendance), teacherAttendanceController.markBulkAttendanceHandler);

router
  .route('/:attendanceId')
  .get(auth(viewTeacherAttendances), validate(teacherAttendanceValidations.getAttendance), teacherAttendanceController.getAttendanceHandler)
  .patch(auth(manageTeacherAttendances), validate(teacherAttendanceValidations.updateAttendance), teacherAttendanceController.updateAttendanceHandler)
  .delete(auth(manageTeacherAttendances), validate(teacherAttendanceValidations.deleteAttendance), teacherAttendanceController.deleteAttendanceHandler);

module.exports = router;

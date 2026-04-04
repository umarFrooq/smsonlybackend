const Attendance = require('./attendance.model');
const attendanceService = require('./attendance.service');
const attendanceController = require('./attendance.controller');
const attendanceValidations = require('./attendance.validations');

module.exports = {
  Attendance,
  attendanceService,
  attendanceController,
  attendanceValidations,
};

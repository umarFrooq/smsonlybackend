const payrollController = require('./payroll.controller');
const payrollService = require('./payroll.service');
const payrollValidation = require('./payroll.validation');
const Payroll = require('./payroll.model');
const leavePolicyController = require('./leavePolicy.controller');
const leavePolicyService = require('./leavePolicy.service');
const leavePolicyValidation = require('./leavePolicy.validation');
const LeavePolicy = require('./leavePolicy.model');
const teacherAttendanceController = require('./teacherAttendance.controller');
const teacherAttendanceService = require('./teacherAttendance.service');
const teacherAttendanceValidation = require('./teacherAttendance.validation');
const TeacherAttendance = require('./teacherAttendance.model');
const salarySlipController = require('./salarySlip.controller');
const salarySlipService = require('./salarySlip.service');

module.exports = {
  payrollController,
  payrollService,
  payrollValidation,
  Payroll,
  leavePolicyController,
  leavePolicyService,
  leavePolicyValidation,
  LeavePolicy,
  teacherAttendanceController,
  teacherAttendanceService,
  teacherAttendanceValidation,
  salarySlipController,
  salarySlipService,
};

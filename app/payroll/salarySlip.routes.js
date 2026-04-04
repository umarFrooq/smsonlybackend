const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const payrollValidation = require('./payroll.validation');
const salarySlipController = require('./salarySlip.controller');
const { payrollController } = require('.');

const router = express.Router();
router
  .route('/my-salary-slips')
  .get(auth('getMySalarySlips'), validate(payrollValidation.getPayrolls), payrollController.getPayrolls);

router
  .route('/:payrollId/generate-slip')
  .get(auth('getPayrolls'), validate(payrollValidation.getPayroll), salarySlipController.generateSalarySlip);

module.exports = router;

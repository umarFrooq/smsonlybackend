const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const payrollValidation = require('./payroll.validation');
const payrollController = require('./payroll.controller');

const router = express.Router();

router
  .route('/')
  .get(auth('getPayrolls'), validate(payrollValidation.getPayrolls), payrollController.getPayrolls);

router
    .route('/generate')
    .post(auth('managePayrolls'), validate(payrollValidation.generatePayroll), payrollController.generatePayroll);

router
    .route('/my-payrolls')
    .get(auth('getMyPayrolls'), validate(payrollValidation.getPayrolls), payrollController.getPayrolls);

router
    .route('/generate')
    .post(auth('managePayrolls'), validate(payrollValidation.generatePayroll), payrollController.generatePayroll);

router
  .route('/:payrollId')
  .get(auth('getPayrolls'), validate(payrollValidation.getPayroll), payrollController.getPayroll)
  .patch(auth('managePayrolls'), validate(payrollValidation.updatePayroll), payrollController.updatePayroll)
  .delete(auth('managePayrolls'), validate(payrollValidation.deletePayroll), payrollController.deletePayroll);

module.exports = router;

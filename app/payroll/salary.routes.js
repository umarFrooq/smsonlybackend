const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const salaryValidation = require('./salary.validation');
const salaryController = require('./salary.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageSalaries'), validate(salaryValidation.createSalary), salaryController.createSalary)
  .get(auth('getSalaries'), validate(salaryValidation.getSalaries), salaryController.getSalaries);

router
  .route('/:salaryId')
  .get(auth('getSalaries'), validate(salaryValidation.getSalary), salaryController.getSalary)
  .patch(auth('manageSalaries'), validate(salaryValidation.updateSalary), salaryController.updateSalary)
  .delete(auth('manageSalaries'), validate(salaryValidation.deleteSalary), salaryController.deleteSalary);

module.exports = router;

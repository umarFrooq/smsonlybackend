const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
// const examValidation = require('./exam.validation');
const examController = require('./exam.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageExams'), examController.createExam)
  .get(auth('getExams'), examController.getExams);

router
  .route('/:examId')
  .get(auth('getExams'), examController.getExam)
  .patch(auth('manageExams'), examController.updateExam)
  .delete(auth('manageExams'), examController.deleteExam);

module.exports = router;

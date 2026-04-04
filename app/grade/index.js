const Grade = require('./grade.model');
const gradeService = require('./grade.service');
const gradeController = require('./grade.controller');
const gradeValidations = require('./grade.validations');

module.exports = {
  Grade,
  gradeService,
  gradeController,
  gradeValidations,
};

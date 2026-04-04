const Paper = require('./paper.model');
const paperService = require('./paper.service');
const paperController = require('./paper.controller');
const paperValidations = require('./paper.validations');

module.exports = {
  Paper,
  paperService,
  paperController,
  paperValidations,
};

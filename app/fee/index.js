const Fee = require('./fee.model');
const feeService = require('./fee.service');
const feeController = require('./fee.controller');
const feeValidations = require('./fee.validations');

module.exports = {
  Fee,
  feeService,
  feeController,
  feeValidations,
};

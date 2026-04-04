const Timetable = require('./timetable.model');
const timetableService = require('./timetable.service');
const timetableController = require('./timetable.controller');
const timetableValidations = require('./timetable.validations');

module.exports = {
  Timetable,
  timetableService,
  timetableController,
  timetableValidations,
};

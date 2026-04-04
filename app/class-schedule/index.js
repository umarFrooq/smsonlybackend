const classScheduleController = require('./class-schedule.controller');
const classScheduleService = require('./class-schedule.service');
const ClassSchedule = require('./class-schedule.model');
const classScheduleValidation = require('./class-schedule.validation'); // Though typically not exported this way
const classScheduleRoutes = require('./class-schedule.routes');


module.exports = {
  classScheduleController,
  classScheduleService,
  ClassSchedule,
  classScheduleValidation, // If needed elsewhere, though usually just for routes
  classScheduleRoutes,    // For app/routes.js
};

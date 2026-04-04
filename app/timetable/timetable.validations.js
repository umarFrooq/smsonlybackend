const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");
const dayOfWeekEnum = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM format

const scheduleEntrySchema = Joi.object({
  dayOfWeek: Joi.string().valid(...dayOfWeekEnum).required(),
  periodNumber: Joi.number().integer().min(1).required(),
  startTime: Joi.string().regex(timeRegex).required()
    .messages({ 'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:00).' }),
  endTime: Joi.string().regex(timeRegex).required()
    .messages({ 'string.pattern.base': 'End time must be in HH:MM format (e.g., 10:00).' })
    .custom((value, helpers) => {
      const { startTime } = helpers.state.ancestors[0]; // Get startTime from the same object
      if (startTime && value <= startTime) {
        return helpers.message('End time must be after start time for the same period.');
      }
      return value;
    }),
  subjectId: Joi.string().custom(objectId).required(),
  teacherId: Joi.string().custom(objectId).allow(null, ''), // Optional teacher
  roomId: Joi.string().trim().allow(null, ''), // Optional room
});

const createTimetable = {
  body: Joi.object().keys({
    gradeId: Joi.string().custom(objectId).required(),
    section: Joi.string().trim().uppercase().required(),
    branchId: Joi.string().custom(objectId).required(),
    effectiveDate: Joi.date().iso().optional(),
    isActive: Joi.boolean().optional(),
    schedule: Joi.array().items(scheduleEntrySchema).min(1).required(),
  }),
};

const getTimetables = {
  query: Joi.object().keys({
    gradeId: Joi.string().custom(objectId),
    section: Joi.string().trim().uppercase(),
    branchId: Joi.string().custom(objectId),
    date: Joi.date().iso(), // For finding effective timetable for a specific date
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(),
  }),
};

const getTimetable = {
  params: Joi.object().keys({
    timetableId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    populate: Joi.string(),
  }),
};

const updateTimetable = {
  params: Joi.object().keys({
    timetableId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      effectiveDate: Joi.date().iso(),
      isActive: Joi.boolean(),
      schedule: Joi.array().items(scheduleEntrySchema).min(1),
      // gradeId, section, branchId are usually not updatable as they define the timetable's scope
    })
    .min(1), // Requires at least one field to be updated
};

const deleteTimetable = {
  params: Joi.object().keys({
    timetableId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createTimetable,
  getTimetables,
  getTimetable,
  updateTimetable,
  deleteTimetable,
};

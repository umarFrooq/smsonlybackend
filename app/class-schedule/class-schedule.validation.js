const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/; // HH:mm format

const createClassSchedule = {
  body: Joi.object().keys({
    schoolId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    gradeId: Joi.string().custom(objectId).required(),
    section: Joi.string().required().trim().max(50),
    subjectId: Joi.string().custom(objectId).required(),
    teacherId: Joi.string().custom(objectId).required(),
    dayOfWeek: Joi.string().required().valid(...daysOfWeek),
    startTime: Joi.string().required().regex(timeRegex).message('startTime must be in HH:mm format'),
    endTime: Joi.string().required().regex(timeRegex).message('endTime must be in HH:mm format')
      .custom((value, helpers) => {
        const startTime = helpers.state.ancestors[0].startTime;
        if (startTime && value <= startTime) {
          return helpers.message('endTime must be after startTime');
        }
        return value;
      }),
    // specificDate: Joi.date().optional(),
    // isActive: Joi.boolean().optional(),
  }),
};

const getClassSchedules = {
  query: Joi.object().keys({
    schoolId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    section: Joi.string().trim().max(50),
    subjectId: Joi.string().custom(objectId),
    teacherId: Joi.string().custom(objectId), // Important for "My Classes"
    dayOfWeek: Joi.string().valid(...daysOfWeek),
    startTime: Joi.string().regex(timeRegex),
    endTime: Joi.string().regex(timeRegex),
    // specificDate: Joi.date(),
    // isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(), // e.g., "subjectId,gradeId,teacherId"
  }),
};

const getClassSchedule = {
  params: Joi.object().keys({
    scheduleId: Joi.string().custom(objectId).required(),
  }),
   query: Joi.object().keys({ // To allow populating specific schedule
    populate: Joi.string(),
  }),
};

const updateClassSchedule = {
  params: Joi.object().keys({
    scheduleId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    schoolId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    section: Joi.string().trim().max(50),
    subjectId: Joi.string().custom(objectId),
    teacherId: Joi.string().custom(objectId),
    dayOfWeek: Joi.string().valid(...daysOfWeek),
    startTime: Joi.string().regex(timeRegex).message('startTime must be in HH:mm format'),
    endTime: Joi.string().regex(timeRegex).message('endTime must be in HH:mm format'),
    // specificDate: Joi.date().optional().allow(null),
    // isActive: Joi.boolean(),
  }).min(1) // Must have at least one field to update
  .custom((value, helpers) => {
    // Validate endTime against startTime if both are provided or if one is provided and the other exists
    // This is tricky if only one is being updated. For simplicity, if endTime is present, startTime must also be present or fetched.
    // Or, the service layer handles validation against the existing record.
    // For now, if both are in the update payload, check them.
    const { startTime, endTime } = value;
    if (startTime && endTime && endTime <= startTime) {
      return helpers.message('endTime must be after startTime');
    }
    return value;
  }),
};

const deleteClassSchedule = {
  params: Joi.object().keys({
    scheduleId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createClassSchedule,
  getClassSchedules,
  getClassSchedule,
  updateClassSchedule,
  deleteClassSchedule,
};

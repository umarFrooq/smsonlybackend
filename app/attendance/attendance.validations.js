const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");

const attendanceStatusEnum = ['present', 'absent', 'leave', 'sick_leave', 'half_day_leave'];

const singleAttendanceRecordSchema = Joi.object({
  studentId: Joi.string().custom(objectId).required(),
  subjectId: Joi.string().custom(objectId).required(),
  gradeId: Joi.string().custom(objectId).required(),
  section: Joi.string().trim().uppercase().required(),
  branchId: Joi.string().custom(objectId).required(),
  date: Joi.date().iso().required(), // Expecting ISO 8601 date string
  status: Joi.string().valid(...attendanceStatusEnum).required(),
  remarks: Joi.string().trim().allow(null, ''),
  schoolId:Joi.string().custom(objectId),  // markedBy will usually be set by the system from the logged-in user, not part of request body
  markedBy:Joi.string().custom(objectId)
});

const markAttendance = {
  body: singleAttendanceRecordSchema,
};

const markBulkAttendance = {
  body: Joi.array().items(singleAttendanceRecordSchema).min(1).required(),
};

const getAttendances = {
  query: Joi.object().keys({
    studentId: Joi.string().custom(objectId),
    subjectId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    section: Joi.string().trim().uppercase(),
    branchId: Joi.string().custom(objectId),
    date: Joi.date().iso(),
    status: Joi.string().valid(...attendanceStatusEnum),
    markedBy: Joi.string().custom(objectId),
    startDate: Joi.date().iso(), // For date range queries
    endDate: Joi.date().iso(),   // For date range queries
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(), // e.g., "studentId:fullname,subjectId:title",
    schoolId:Joi.string().custom(objectId),
  }),
};

const getAttendance = {
  params: Joi.object().keys({
    attendanceId: Joi.string().custom(objectId).required(),
  }),
   query: Joi.object().keys({
    populate: Joi.string(),
  }),
};

const updateAttendance = {
  params: Joi.object().keys({
    attendanceId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid(...attendanceStatusEnum),
      remarks: Joi.string().trim().allow(null, ''),
      // Potentially other fields like date, subjectId etc. if they are updatable
      // For now, only status and remarks are considered common updates
    })
    .min(1), // Requires at least one field to be updated
};

const deleteAttendance = {
  params: Joi.object().keys({
    attendanceId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  markAttendance,
  markBulkAttendance,
  getAttendances,
  getAttendance,
  updateAttendance,
  deleteAttendance,
};

const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const createTeacherAttendance = {
  body: Joi.object().keys({
    teacher: Joi.string().custom(objectId).required(),
    school: Joi.string().custom(objectId).required(),
    branch: Joi.string().custom(objectId).required(),
    date: Joi.date().max('now').required(),
    status: Joi.string().valid('present', 'absent', 'leave', 'sick_leave', 'half_day_leave').required(),
    leaveType: Joi.string().allow('', null),
    remarks: Joi.string().allow('', null),
  }),
};

const getTeacherAttendances = {
  query: Joi.object().keys({
    teacher: Joi.string().custom(objectId),
    date: Joi.date(),
    status: Joi.string(),
    branch: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(),
    schoolId: Joi.string().custom(objectId),
  }),
};

const getTeacherAttendance = {
  params: Joi.object().keys({
    teacherAttendanceId: Joi.string().custom(objectId),
  }),
};

const updateTeacherAttendance = {
  params: Joi.object().keys({
    teacherAttendanceId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid('present', 'absent', 'leave', 'sick_leave', 'half_day_leave'),
      leaveType: Joi.string().allow('', null),
      remarks: Joi.string().allow('', null),
    })
    .min(1),
};

const deleteTeacherAttendance = {
  params: Joi.object().keys({
    teacherAttendanceId: Joi.string().custom(objectId),
  }),
};

const bulkCreateTeacherAttendance = {
  body: Joi.array().items(Joi.object().keys({
    teacherId: Joi.string().custom(objectId).required(),
    schoolId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    date: Joi.date().max('now').required(),
    status: Joi.string().valid('present', 'absent', 'leave', 'sick_leave', 'half_day_leave').required(),
    leaveType: Joi.string().allow('', null),
    remarks: Joi.string().allow('', null),
    markedBy: Joi.string().custom(objectId).required(),
  })),
};


const getUnmarkedTeachers = {
  query: Joi.object().keys({
    schoolId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    date: Joi.date().required(),
  }),
};

module.exports = {
  createTeacherAttendance,
  getTeacherAttendances,
  getTeacherAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
  bulkCreateTeacherAttendance,
  getUnmarkedTeachers,
};

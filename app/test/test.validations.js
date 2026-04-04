const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");
const createTest = {
  body: Joi.object().keys({
    title: Joi.string().required().trim(),
    subjectId: Joi.string().custom(objectId).required(),
    gradeId: Joi.string().custom(objectId).required(),
    section: Joi.string().trim().uppercase().allow(null, ''), // Optional
    branchId: Joi.string().custom(objectId).required(),
    totalMarks: Joi.number().required().min(0),
    passingMarks: Joi.number().min(0).when('totalMarks', {
        is: Joi.exist(),
        then: Joi.number().max(Joi.ref('totalMarks')),
        otherwise: Joi.optional()
    }).allow(null),
    date: Joi.date().iso().required(), // Expecting ISO 8601 date string
    startTime: Joi.string().trim().allow(null, ''), // Optional, e.g., "10:00 AM"
    endTime: Joi.string().trim().allow(null, ''),   // Optional
    description: Joi.string().trim().allow(null, ''), // Optional
    // createdBy will be set by the system from the logged-in user
  }),
};

const getTests = {
  query: Joi.object().keys({
    title: Joi.string().trim(),
    subjectId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    section: Joi.string().trim().uppercase(),
    branchId: Joi.string().custom(objectId),
    date: Joi.date().iso(),
    startDate: Joi.date().iso(), // For date range queries
    endDate: Joi.date().iso(),   // For date range queries
    createdBy: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(), // e.g., "subjectId:title,gradeId:title"
  }),
};

const getTest = {
  params: Joi.object().keys({
    testId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    populate: Joi.string(),
  }),
};

const updateTest = {
  params: Joi.object().keys({
    testId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim(),
      subjectId: Joi.string().custom(objectId),
      gradeId: Joi.string().custom(objectId),
      section: Joi.string().trim().uppercase().allow(null, ''),
      branchId: Joi.string().custom(objectId), // Usually not updatable, but included for completeness
      totalMarks: Joi.number().min(0),
      passingMarks: Joi.number().min(0).when('totalMarks', {
        is: Joi.exist(),
        then: Joi.number().max(Joi.ref('totalMarks')),
        otherwise: Joi.optional()
      }).allow(null),
      date: Joi.date().iso(),
      startTime: Joi.string().trim().allow(null, ''),
      endTime: Joi.string().trim().allow(null, ''),
      description: Joi.string().trim().allow(null, ''),
    })
    .min(1), // Requires at least one field to be updated
};

const deleteTest = {
  params: Joi.object().keys({
    testId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createTest,
  getTests,
  getTest,
  updateTest,
  deleteTest,
};

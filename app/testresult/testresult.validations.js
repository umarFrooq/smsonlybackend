const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");
const createTestResult = {
  body: Joi.object().keys({
    testId: Joi.string().custom(objectId).required(),
    studentId: Joi.string().custom(objectId).required(),
    obtainedMarks: Joi.number().required().min(0),
    comments: Joi.string().trim().allow(null, ''), // Optional
    // answerSheetImage is handled by file upload middleware, not direct body validation for its content
  }),
};

const getTestResults = {
  query: Joi.object().keys({
    testId: Joi.string().custom(objectId),
    studentId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    markedBy: Joi.string().custom(objectId),
    minObtainedMarks: Joi.number().min(0),
    maxObtainedMarks: Joi.number().min(0),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(), // e.g., "testId:title,studentId:fullname"
  }),
};

const getTestResult = {
  params: Joi.object().keys({
    resultId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    populate: Joi.string(),
  }),
};

const updateTestResult = {
  params: Joi.object().keys({
    resultId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      obtainedMarks: Joi.number().min(0),
      comments: Joi.string().trim().allow(null, ''),
      // studentId, testId, etc., are generally not updatable after creation.
      // If they were, they would need validation here.
      // answerSheetImage update is handled by file upload logic + service.
      deleteImage:Joi.string()
    })
    .min(1), // Requires at least one field to be updated
};

const deleteTestResult = {
  params: Joi.object().keys({
    resultId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createTestResult,
  getTestResults,
  getTestResult,
  updateTestResult,
  deleteTestResult,
};

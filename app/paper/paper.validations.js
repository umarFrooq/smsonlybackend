const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");

const paperTypeEnum = ['past_paper', 'model_paper', 'template'];
const uploadPaper = {
  body: Joi.object().keys({
    title: Joi.string().required().trim(),
    subjectId: Joi.string().custom(objectId).required(),
    gradeId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    year: Joi.string().required().trim(), // e.g., "2023", "2022-2023"
    type: Joi.string().valid(...paperTypeEnum).required(),
    description: Joi.string().trim().allow(null, ''), // Optional
    // paperFileUrl is handled by file upload middleware, not direct body validation for its content
  }),
};

const getPapers = {
  query: Joi.object().keys({
    title: Joi.string().trim(),
    subjectId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    year: Joi.string().trim(),
    type: Joi.string().valid(...paperTypeEnum),
    uploadedBy: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(), // e.g., "subjectId:title,gradeId:title"
  }),
};

const getPaper = {
  params: Joi.object().keys({
    paperId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    populate: Joi.string(),
  }),
};

const updatePaper = {
  params: Joi.object().keys({
    paperId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim(),
      subjectId: Joi.string().custom(objectId),
      gradeId: Joi.string().custom(objectId),
      branchId: Joi.string().custom(objectId),
      year: Joi.string().trim(),
      type: Joi.string().valid(...paperTypeEnum),
      description: Joi.string().trim().allow(null, ''),
      // paperFileUrl update is handled by file upload logic + service.
    })
    .min(1), // Requires at least one field to be updated
};

const deletePaper = {
  params: Joi.object().keys({
    paperId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  uploadPaper,
  getPapers,
  getPaper,
  updatePaper,
  deletePaper,
};

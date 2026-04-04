const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");
const createGrade = {
  body: Joi.object().keys({
    title: Joi.string().required().trim(),
    levelCode: Joi.string().trim().allow(null, ''), // Optional, can be empty
    description: Joi.string().trim().allow(null, ''), // Optional
    branchId: Joi.string().custom(objectId).required(),
    sections: Joi.array().items(Joi.string().trim().uppercase()).optional().unique(),
    nextGradeId: Joi.string().custom(objectId).allow(null), // Optional, can be null
  }),
};

const getGrades = {
  query: Joi.object().keys({
    title: Joi.string().trim(),
    levelCode: Joi.string().trim(),
    branchId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(), // e.g., "nextGradeId,branchId"
    schoolId:Joi.string().custom(objectId),
  }),
};

const getGrade = {
  params: Joi.object().keys({
    gradeId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    populate: Joi.string(), // e.g., "nextGradeId,branchId"
  }),
};

const updateGrade = {
  params: Joi.object().keys({
    gradeId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim(),
      levelCode: Joi.string().trim().allow(null, ''),
      description: Joi.string().trim().allow(null, ''),
      branchId: Joi.string().custom(objectId),
      // sections are managed via dedicated endpoints
      nextGradeId: Joi.string().custom(objectId).allow(null),
         sections: Joi.array().items(Joi.string().trim().uppercase()).optional().unique(),

    })
    .min(1), // Requires at least one field to be updated
};

const deleteGrade = {
  params: Joi.object().keys({
    gradeId: Joi.string().custom(objectId).required(),
  }),
};

const manageSection = { // For adding a single section
  params: Joi.object().keys({
    gradeId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    sectionName: Joi.string().trim().uppercase().required(),
  }),
};

const removeSectionParams = { // For removing a single section via params
    params: Joi.object().keys({
        gradeId: Joi.string().custom(objectId).required(),
        sectionName: Joi.string().trim().uppercase().required(),
    }),
};


const manageSectionsArray = { // For PUT - replacing all sections
  params: Joi.object().keys({
    gradeId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    sections: Joi.array().items(Joi.string().trim().uppercase()).required().unique(),
  }),
};


module.exports = {
  createGrade,
  getGrades,
  getGrade,
  updateGrade,
  deleteGrade,
  manageSection, // for POST to add one section
  removeSectionParams, // for DELETE one section
  manageSectionsArray, // for PUT to replace all sections
};

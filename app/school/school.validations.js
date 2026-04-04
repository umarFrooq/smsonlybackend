const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");

const createSchool = {
  body: Joi.object().keys({
    nameOfSchool: Joi.string().required().min(1).trim(),
    adminEmail: Joi.string().required().email(),
    // Add other fields for school creation payload if they become necessary
  }),
};

const getSchools = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().custom(objectId).required(),
  }),
};

const updateSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      nameOfSchool: Joi.string().min(1).trim(),
      // Add other updatable fields here
    })
    .min(1), // At least one field must be provided for an update
};

const deleteSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createSchool,
  getSchools,
  getSchool,
  updateSchool,
  deleteSchool,
};

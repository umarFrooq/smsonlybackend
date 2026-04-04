const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');
var enums = require('../../config/enums')


const createRole = {
  body: Joi.object().keys({
    role: Joi.string().valid(...Object.values(enums.roleTypes)).required(),
    access: Joi.array().required().items(Joi.string().required()),
    label: Joi.string().min(3).max(30),
    description: Joi.string().min(10).max(200),
  })
}
const findRoleById = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};
const deleteAccessTypes = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    values: Joi.array().required().items(Joi.string().required())
  }),
};
const updateRole = {
  body: Joi.object().keys({
    access: Joi.array().items(Joi.string()),
    label: Joi.string(),
    description: Joi.string(),
  }).min(1),
  params: Joi.object().keys({ id: Joi.string().custom(objectId).required() })
}
const getRoles = Joi.object({
  query: Joi.object().keys({
    sortBy: Joi.string(),
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    role: Joi.string().valid(...Object.values(enums.roleTypes)),
    access: Joi.array().items(Joi.string()),
  })
});

module.exports = {
  updateRole,
  findRoleById,
  createRole,
  deleteAccessTypes,
  getRoles
}
const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const createAccess = {
  body: Joi.object().keys({
    module: Joi.string().required(),
    data: Joi.array().items(Joi.object().keys({
      name: Joi.string().required(),
      label: Joi.string().required(),
      description: Joi.string().required(),
    }))
  })
};

const updateAccess = {
  body: Joi.object().keys({
    name: Joi.string().min(3).max(30),
    module: Joi.string(),
    label: Joi.string().min(3).max(30),
    description: Joi.string().min(10).max(200),
  })
  .or('name', 'module', 'label', 'description'), // At least one field must be present
};

const updateModuleName = {
  body: Joi.object().keys({
    previousModule: Joi.string().required(),
    newModule: Joi.string().required(),
  })
};

const getAccessById = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  })
};

const getAccessByModule = {
  params: Joi.object().keys({
    module: Joi.string().required(),
  })
};

const deleteAccess = {
  params: Joi.object().keys({
    id:Joi.string().custom(objectId).required(),
  })
};

const deleteModule = {
  params: Joi.object().keys({
    module: Joi.string().required(),
  })
};

module.exports = {
  createAccess,
  updateAccess,
  updateModuleName,
  getAccessById,
  getAccessByModule,
  deleteAccess,
  deleteModule,
};

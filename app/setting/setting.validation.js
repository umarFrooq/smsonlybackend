const Joi = require("joi");
const { objectId, emptyVal } = require("../auth/custom.validation");
const { dataTypes,settingCategory,regions } = require("../../config/enums");
const createTable = {
  body: Joi.object().keys({
    key: Joi.string().required().custom(emptyVal),
    label: Joi.string().required().custom(emptyVal),
    unit: Joi.string().custom(emptyVal),
    keyValue: Joi.string().required().custom(emptyVal),
    active: Joi.boolean(),
    description: Joi.string().required().custom(emptyVal),
    dataType: Joi.string().valid(...Object.values(dataTypes)),
    category:Joi.string().valid(...Object.values(settingCategory)).required()
  }),
};

const getTableById = {
  params: Joi.object().keys({
    tableId: Joi.string().custom(objectId).required(),
  }),
};

const updateTableById = {
  params: Joi.object().keys({
    tableId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    key: Joi.string().custom(emptyVal),
    label: Joi.string().custom(emptyVal),
    unit: Joi.string().custom(emptyVal),
    keyValue: Joi.string().custom(emptyVal),
    active: Joi.boolean(),
    description: Joi.string().custom(emptyVal),
    dataType: Joi.string().valid(...Object.values(dataTypes)),
    category:Joi.string().valid(...Object.values(settingCategory))
  }),
};
const deleteTableById = {
  params: Joi.object().keys({
    tableId: Joi.string().custom(objectId).required(),
  }),
};
const filterTable = {
  query: Joi.object().keys({
    key: Joi.string().custom(emptyVal),
    label: Joi.string().custom(emptyVal),
    unit: Joi.string().custom(emptyVal),
    keyValue: Joi.string().custom(emptyVal),
    active: Joi.boolean(),
    name: Joi.string().custom(emptyVal),
    value: Joi.string().custom(emptyVal),
    sortBy: Joi.string(),
    to: Joi.date(),
    from: Joi.date(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    category:Joi.string().valid(...Object.values(settingCategory))
  }).min(1),
};
const getTaxes = {
  query: Joi.object().keys({
    origin: Joi.string().required().valid(...Object.values(regions)),
    sellerId:Joi.string().custom(objectId)
  }),
};
module.exports = {
  createTable,
  getTableById,
  updateTableById,
  deleteTableById,
  filterTable,
  getTaxes
};

const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");

const getAllRRP = {
  query: Joi.object().keys({
    seller: Joi.string().custom(objectId),
    customer: Joi.string().custom(objectId),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1),
    sortBy: Joi.string(),
    rrp: Joi.string(),
    creditBack: Joi.boolean(),
  })
}

module.exports = {
  getAllRRP
}
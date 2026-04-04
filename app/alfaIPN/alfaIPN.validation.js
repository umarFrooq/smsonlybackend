const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const createOrderDetail = {
  body: Joi.object().keys({
    refCode: Joi.string(),
    origin: Joi.object().keys({
      source: Joi.string(),
      version: Joi.string()
    }).allow({}, null),
    orderNote: Joi.string(),
    pvId: Joi.string().required()
  })
};

module.exports = {
    createOrderDetail
}
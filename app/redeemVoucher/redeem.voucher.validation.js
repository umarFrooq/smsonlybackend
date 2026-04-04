const Joi = require("joi");
const { objectId } = require('../auth/custom.validation');

const findRedeemVoucher = {
  query: Joi.object().keys({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    sortBy: Joi.string(),
    to: Joi.date(),
    from: Joi.date(),
    voucherId: Joi.string().custom(objectId),
    userId: Joi.string().custom(objectId),
    voucher: Joi.string(),
    status: Joi.string(),

  })
}

module.exports = { findRedeemVoucher }
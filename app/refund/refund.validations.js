const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');
const { refundMethod } = require('@/config/enums');

const createRefund = {
  body: Joi.object().keys({
    orderId: Joi.required().custom(objectId),
    refundReason: Joi.string().required(),
    // refundBy: Joi.required().custom(objectId),
    // refundTo: Joi.required().custom(objectId),
    refundProduct: Joi.object().keys({
      product: Joi.required().custom(objectId),
      quantity: Joi.number().required(),
    }).required(),
    refundByAdmin: Joi.boolean(),             
    refundNote: Joi.string().required(),

  }),
}

const updateRefund = {
  body: Joi.object().keys({
    adminRefundNote: Joi.string(),
    refundStatus: Joi.string().required(),
    // refundBy: Joi.required().custom(objectId),
    // refundTo: Joi.required().custom(objectId),
    refundedAmount: Joi.number(),
    sellerRefundNote: Joi.string(),
    refundMethod: Joi.string().valid(...Object.values(refundMethod))
  }),
}

const getRefunds = {
  query: Joi.object().keys({
    refundBy: Joi.string().custom(objectId),
    refundTo: Joi.string().custom(objectId),
    refundStatus: Joi.string(),
    rejectByAdmin: Joi.boolean(),
    refundByAdmin: Joi.boolean(),
    approvedByAdmin: Joi.boolean(),
    productId: Joi.string().custom(objectId),
    from: Joi.date(),
    to: Joi.date(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  })
}

const getRefundsUser = {
  query: Joi.object().keys({
    // refundBy: Joi.string().custom(objectId),
    // refundTo: Joi.string().custom(objectId),
    refundStatus: Joi.string(),
    // rejectByAdmin: Joi.boolean(),
    // refundByAdmin: Joi.boolean(),
    // approvedByAdmin: Joi.boolean(),
    // productId: Joi.string().custom(objectId),
    from: Joi.date(),
    to: Joi.date(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  })
}

const getRefund = {
  params: Joi.object().keys({
    refundId: Joi.string().custom(objectId).required()
  })
}
module.exports = {
  createRefund,
  updateRefund,
  getRefunds,
  getRefundsUser,
  getRefund
}
const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');
const {refund}=require('../../config/enums');
const { query } = require('express');

const updatePayment = {
  params: Joi.object().keys({
    paymentId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    status:Joi.string(),
    type:Joi.string(),
    reference_no:Joi.string(),
   
    
    
  }),
};
const getPayment = {
  params: Joi.object().keys({
    paymentId: Joi.string().custom(objectId),
  }),
};
const getAllPayments = {
  query: Joi.object().keys({
    orderDetail: Joi.string(),
    type: Joi.string(),
    user: Joi.string().custom(objectId),
    reference_no: Joi.string(),
    status: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};
const deletePayment = {
  params: Joi.object().keys({
    paymentId: Joi.string().custom(objectId),
  }),
};

const orderDetail = {
  query: Joi.object().keys({
   cartId:Joi.string().custom(objectId),
   
  }),

};

const refundMoney = {
  body: Joi.object().keys({
   payId: Joi.string().required(),
   type: Joi.string().required().valid(...Object.keys(refund)),
   refundId: Joi.string().custom(objectId),
  }),

};
module.exports = {
  getPayment,
  getAllPayments,
  updatePayment,
  deletePayment,
  orderDetail,
  refundMoney
};

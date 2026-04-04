const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');
const { paymentMethods, transactionTypes, addOnTypes } = require('@/config/enums');

const manualTransaction = {
  body: Joi.object().keys({
    sellerDetailId: Joi.string().custom(objectId),
    amount: Joi.number().required().min(1),
    description:Joi.string().max(500)

  }),
}
const getAdminTransactions = {
  query: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    method: Joi.string().valid(...Object.values(paymentMethods)),
    type: Joi.string().valid(...Object.values(transactionTypes)),
    paymentGateway: Joi.string(),
    addOnType: Joi.string().valid(...Object.values(addOnTypes)),
    orderId: Joi.string().custom(objectId),
    orderDetailId: Joi.string().custom(objectId),
    sellerDetailId: Joi.string().custom(objectId),
    adminId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number(),
    page: Joi.number(),
    to: Joi.date(),
    from: Joi.date(),
    orderNumber: Joi.string()
  }),
}

const getCustomerTransactions = {
  query: Joi.object().keys({
    method: Joi.string().valid(...Object.values(paymentMethods)),
    type: Joi.string().valid(...Object.values(transactionTypes)),
    addOnType: Joi.string().valid(...Object.values(addOnTypes)),
    orderId: Joi.string().custom(objectId),
    orderDetailId: Joi.string().custom(objectId),
    adminId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit:  Joi.number().integer(),
    page: Joi.number().integer(),
    to: Joi.date(),
    from: Joi.date(),
    orderNumber: Joi.string()
  }),
}
const getSellerTransactions = {
  query: Joi.object().keys({
    method: Joi.string().valid(...Object.values(paymentMethods)),
    type: Joi.string().valid(...Object.values(transactionTypes)),
    addOnType: Joi.string().valid(...Object.values(addOnTypes)),
    orderId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number(),
    page: Joi.number(),
    to: Joi.date(),
    from: Joi.date(),
    orderNumber: Joi.string()
  }),
}
module.exports = {
  manualTransaction,
  getAdminTransactions,
  getCustomerTransactions,
  getSellerTransactions
}
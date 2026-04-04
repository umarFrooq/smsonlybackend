// /**
//  * Vintega Solutions
//  *
//  * Payment Controller, it encapsulates all cart related methods.
//  * These methods are called via API endpoints. Endpoints require user level authorization.
//  * 
//  * @summary address Controller, called via API endpoints
//  * @author Muhammad Mustafa
//  *
//  * Created at     : 2020-08-03 13:52:11 
//  * Last modified  : 2020-11-03 14:01:18
//  */


// /**
//  * @function Payments //called via API endpoint
//  *
//  * @param {*} req // Query and body parameters
//  * @param {*} res // API Response
//  * @param {*} next // not used at the moment
//  * @returns API Response
//  */
// //TODO: Document all methods and correct response messages accordingly

const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const paymentService  = require('./payment.service');
const checkoutService = require('../checkout/checkout.service')
const en=require('../../config/locales/en')
const { logEvent } = require('../analytics/analytics.service');



const getPayment = catchAsync(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.paymentId);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, en.responseMessages.PAYMENT_MODULE.PAYMENT_NOT_FOUND);
  }
  await logEvent({ module: 'payment', action: 'get', userId: req.user ? req.user.id : null, details: { paymentId: req.params.paymentId } });
  res.sendStatus(payment);
});
const getAllPayments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ["user","type","status","orderDetail","reference_no"]);
    const options = pick(req.query, ["sortBy", "limit", "page"]);
    const result = await paymentService.queryPayments(filter, options);
    // res.status(httpStatus.OK).send(result);
    res.sendStatus(result);
  });
const updatePayment = catchAsync(async (req, res) => {
  const payment = await paymentService.updatePayment(req.params.paymentId,req.user, req.body);
  await logEvent({ module: 'payment', action: 'update', userId: req.user ? req.user.id : null, details: { paymentId: req.params.paymentId, body: req.body } });
  res.sendStatus(payment);
});
const deletePayment = catchAsync(async (req, res) => {
  await paymentService.deletePayment(req.params.paymentId);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus()
});

let createSession = async (req, res) => {
  const result = await checkoutService.createSession(req.body)
  res.sendStatus(result);
}
let webHook = async (req, res) => {
  const result = await checkoutService.webHook(req.body)
  res.sendStatus(result);
}
let getPaymentDetail = async (req, res) => {
  const result = await checkoutService.getPaymentDetail(req.body,req.query.cartId,req.user)
  res.sendStatus(result);
}
let refundMoney = async (req, res) => {
  const result = await checkoutService.refundMoney(req.body,req.query.payId)
  res.sendStatus(result);
}
let checkOutTransaction = async (req, res) => {
  let result = await checkoutService.checkOutTransaction(req.body, req.user);
  res.sendStatus(result)
}
let getCardsDetail = async (req, res) => {
  let result = await checkoutService.getCardsDetail( req.user);
  res.sendStatus(result)
}
module.exports = {
  getPayment,
  getAllPayments,
  updatePayment,
  deletePayment,
  webHook,
  getPaymentDetail,
  createSession,
  refundMoney,
  checkOutTransaction,
  getCardsDetail
};

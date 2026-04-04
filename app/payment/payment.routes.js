
const express = require('express');

const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const paymentController= require("./payment.controller")
const paymentValidation= require("./payment.validations")

const router = express.Router();

router
  .route('/')
.get(auth('managePayments'),validate(paymentValidation.getAllPayments),paymentController.getAllPayments);
router.route('/session').post(auth('cardPayment'), paymentController.createSession)
module.exports = router
router.route('/webhook').post(paymentController.webHook)
router.route('/order-detail').post(auth('cardPayment'), validate(paymentValidation.orderDetail), paymentController.getPaymentDetail)
// router.route('/refund-moneny').post(validate(paymentValidation.refundMoney), paymentController.refundMoney)
router.route('/transaction').post(auth('cardPayment'),paymentController.checkOutTransaction)
router.route('/card-info').get(auth('cardPayment'),paymentController.getCardsDetail)

  router
    .route('/:paymentId')  
  .get(validate(paymentValidation.getPayment), paymentController.getPayment)
  .patch(auth('cardPayment'), validate(paymentValidation.updatePayment),paymentController.updatePayment)
  //.delete(auth('managePayment'), validate(paymentValidation.deletePayment), paymentController.deletePayment)
  

module.exports = router;


const express = require('express');
const router = express.Router();
const refundController = require('./refund.controller');
const refundValidator = require('./refund.validations');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const Upload = require("../../middlewares/files");

router.route('/')
  .post(auth("refund"), Upload.uploadImages, validate(refundValidator.createRefund), refundController.createRefund)
  .get(auth("refund"), validate(refundValidator.getRefundsUser), refundController.getRefunds)
router.route("/seller")
  .get(auth("manageRefund"), validate(refundValidator.getRefunds), refundController.getRefunds)
router.route("/seller/:refundId")
  .patch(auth("manageRefund"), validate(refundValidator.updateRefund), refundController.updateRefund)
  .get(auth("manageRefund"), validate(refundValidator.getRefund), refundController.getRefund)
router.route('/:refundId')
  .get(auth("refund"), validate(refundValidator.getRefund), refundController.getRefund)

module.exports = router;
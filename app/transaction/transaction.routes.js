const router = require('express').Router();
const validate = require('../../middlewares/validate');
const transactionValidation = require('./transaction.validations');
const transactionController = require("./transaction.controller")
const auth = require('../../middlewares/auth');
const Upload = require("../../middlewares/files")
router.route("/")
  .post(auth("manageTransaction"), Upload.uploadImages, validate(transactionValidation.manualTransaction), transactionController.manualTransaction)
  .get(auth("transaction"), validate(transactionValidation.getCustomerTransactions), transactionController.getCustomerTransactions)
router.route("/admin")
  .get(auth("manageTransaction"), validate(transactionValidation.getAdminTransactions), transactionController.getAdminTransactions)
router.route("/seller")
  .get(auth("transaction"), validate(transactionValidation.getSellerTransactions), transactionController.getSellerTransactions)
router.route("/orderDetail/admin")
  .get(auth("manageTransaction"), validate(transactionValidation.getAdminTransactions), transactionController.getFullOrderTransactions)

module.exports = router
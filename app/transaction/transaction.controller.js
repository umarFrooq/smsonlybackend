const en = require('../../config/locales/en');
const catchAsync = require("../../utils/catchAsync");
const transactionService = require("./transaction.service");
const pick = require('../../utils/pick');

const manualTransaction = catchAsync(async (req, res) => {
  const result = await transactionService.manualTransaction(req.body, req.files, req.user);
  res.sendStatus(result);
})

const getAdminTransactions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['userId', "orderNumber", 'method', 'type', 'paymentGateway', 'addOnType', 'orderId', 'orderDetailId', "sellerDetailId", "adminId", "to", "from"]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await transactionService.getAdminTransactions(filter, options, req.user);
  res.sendStatus(result);
})
const getSellerTransactions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['userId', 'method', "orderNumber", 'type', 'paymentGateway', 'orderId', "to", "from"]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await transactionService.getSellerTransactions(filter, options, req.user);
  res.sendStatus(result);
})
const getCustomerTransactions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['method', 'type', "orderNumber", 'addOnType', 'orderId', "orderDetailId", "to", "from"]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await transactionService.getCustomerTransactions(filter, options, req.user);
  res.sendStatus(result);
})

const getFullOrderTransactions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['userId', "orderNumber", 'method', 'type', 'paymentGateway', 'addOnType', 'orderId', 'orderDetailId', "sellerDetailId", "adminId", "to", "from"]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await transactionService.getFullOrderTransactions(filter, options, req.user);
  res.sendStatus(result);
})
module.exports = {
  manualTransaction,
  getAdminTransactions,
  getCustomerTransactions,
  getSellerTransactions,
  getFullOrderTransactions
}
const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const refundService = require('./refund.service');

const createRefund = catchAsync(async (req, res) => {
  const refund = await refundService.createRefund(req.body, req.files, req.user.id);
  // res.status(httpStatus.OK).send(refund);
  res.sendStatus(refund.data,refund.status,refund.message);
});

const updateRefund = catchAsync(async (req, res) => {
  const refund = await refundService.updateRefund(req.body, req.params.refundId, req.user);
  // res.status(httpStatus.OK).send(refund);
  res.sendStatus(refund.data,refund.status,refund.message);
});

const getRefunds = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['refundBy', 'refundTo', 'refundStatus', 'rejectByAdmin', 'refundByAdmin', 'approvedByAdmin', 'productId', 'from', 'to']);
  const search = pick(req.query, ['name', 'value'])
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const refund = await refundService.getRefunds(req.user, filter, options);
  // res.status(httpStatus.OK).send(refund);
  res.sendStatus(refund.data,refund.status,refund.message);
})

const getRefund = catchAsync(async (req, res) => {
  const refund = await refundService.getRefund(req.params.refundId, req.user);
  // res.status(httpStatus.OK).send(refund);
  res.sendStatus(refund.data,refund.status,refund.message);
})
module.exports = {
  createRefund,
  updateRefund,
  getRefunds,
  getRefund
}

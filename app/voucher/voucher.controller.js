const voucherService = require('./voucher.service');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const httpStatus = require('http-status');
const { logEvent } = require('../analytics/analytics.service');

const createVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.createVoucher(req.body);
  await logEvent({ module: 'voucher', action: 'create', userId: req.user ? req.user.id : null, details: req.body });
  res.sendStatus(voucher.data, voucher.status, voucher.message);
});

const getVouchers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['to', 'from', 'status', 'endDate', 'startDate', "discountType", "type", "couponType"]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const vouchers = await voucherService.getVouchers(filter, options);
  // res.status(httpStatus.OK).send(vouchers);
  res.sendStatus(vouchers.data, vouchers.status, vouchers.message);
})

const getVoucherById = catchAsync(async (req, res) => {
  const voucher = await voucherService.getVoucherById(req.params.voucherId);
  // res.status(httpStatus.OK).send(voucher);
  res.sendStatus(voucher.data, voucher.status, voucher.message)
});

const updateVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.updateVoucher(req.params.voucherId, req.body);
  // res.status(httpStatus.OK).send(voucher);
  res.sendStatus(voucher.data, voucher.status, voucher.message);
})

const getByVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.getByVouter(req.params.vouter);
  // res.status(httpStatus.OK).send(voucher);
  res.sendStatus(voucher);
})

const redeemVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.redeemVoucher(req.params.voucher, req.user);
  await logEvent({ module: 'voucher', action: 'redeem', userId: req.user ? req.user.id : null, details: { voucher: req.params.voucher } });
  res.sendStatus(voucher.data, voucher.status, voucher.message);
})

const deleteVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.deleteVoucher(req.params.voucherId)
  res.status(200).send(voucher);
})
const getUserVouchers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['to', 'from', 'status', 'endDate', 'startDate', "discountType", "type", "couponType"]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const voucher = await voucherService.getUserVouchers(filter, options);
  res.status(200).send(voucher);
})
module.exports = { createVoucher, getVouchers, getVoucherById, updateVoucher, getByVoucher, redeemVoucher, deleteVoucher, getUserVouchers };
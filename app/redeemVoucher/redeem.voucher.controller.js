const httpStatus = require('http-status');
const voucherService = require('./redeem.voucher.service');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');

const findRedeemVoucher = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['to', 'from', 'voucherId', 'userId']);
  const lookUpQuery = pick(req.query, ['voucher', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const vouchers = await voucherService.findRedeemVoucher(filter, options, lookUpQuery);
  // res.status(httpStatus.OK).send(vouchers);
  res.sendStatus(vouchers.data,vouchers.status,vouchers.message);
})

module.exports = { findRedeemVoucher };
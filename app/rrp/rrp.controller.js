
const httpStatus = require("http-status");
const pick = require("../../utils/pick");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const rrpService = require("./rrp.service")

const getAllRRP = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["rrp", "seller", "customer","creditBack"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await rrpService.getAllRRP(req.user, filter, options);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result.data,result.status,result.message);
});

module.exports = {
  getAllRRP
}
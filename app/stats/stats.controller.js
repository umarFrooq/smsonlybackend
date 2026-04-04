const statServices = require('./stats.service');
const httpStatus = require("http-status");
const pick = require("../../utils/pick");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const en = require('../../config/locales/en')
const getVisitStats = catchAsync(async (req, res) => {
  const documentCount = await statServices.getVisitCount(
    //   req.user,
    req.query
  );
  // console.log(documentCount);
  // res.status(httpStatus.OK).send({ status: 200, message: "Found", result: documentCount })
  res.sendStatus(documentCount)
});

const getOrderCount = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['seller', 'from', 'to'])
  const documentCount = await statServices.getDocumentCount(
    filter
  );
  // res.status(httpStatus.OK).send({ status: 200, message: "Found", result: documentCount })
  res.sendStatus(documentCount)
});

const averageStatusAge = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['seller', 'from', 'to'])
  const documentCount = await statServices.averageStatusAge(
    filter
  );
  // res.status(httpStatus.OK).send({ status: 200, message: "Found", result: documentCount })
  res.sendStatus(documentCount)
});
module.exports = {
  getVisitStats,
  getOrderCount,
  averageStatusAge
}
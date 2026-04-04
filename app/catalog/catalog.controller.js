const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const catalogService = require("./catalog.service");

const createCatalog = catchAsync(async (req, res) => {
  const catalog = await catalogService.createCatalog(req.query.userId);
  res.status(httpStatus.CREATED).send(catalog);
})

const sellerCatalog = catchAsync(async (req, res) => {
  const catalog = await catalogService.sellerCatalogs(req.user.id, req.body);
  res.sendStatus(catalog);
})

module.exports = {
  createCatalog,
  sellerCatalog
};
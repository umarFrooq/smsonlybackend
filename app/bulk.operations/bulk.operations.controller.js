const catchAsync = require("@/utils/catchAsync");
const bulkOperationService = require("./bulk.operations.service");
const productStore = catchAsync(async (req, res) => {
  const products = await bulkOperationService.productStore(req.query.removeProduct, req.query.userId, req.query.images);
  // res.status(200).send(products)
  res.sendStatus(products.data, products.status, products.message)
});

const updateProductRegions = catchAsync(async (req, res) => {
  const result = await bulkOperationService.updateProductRegions(req.body);
  res.sendStatus(result);
})
module.exports = {
  productStore,
  updateProductRegions
}
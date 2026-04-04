const catchAsync = require("@/utils/catchAsync");
const reviewService = require("./review.stats.service");

const getByTypeId = catchAsync(async (req, res) => {
  const result = await reviewService.getByTypeId(req.params.typeId);
  // res.status(200).send(result);
  res.sendStatus(result.data,result.status,result.message);
});

const getByStoreId = catchAsync(async (req, res) => {
  const result = await reviewService.getStoreStats(req.params.sellerDetailId);
  // res.status(200).send({ isSuccess: true, message: "", status: 200, data: result });
  res.sendStatus(result);
});

module.exports = {
  getByStoreId,
  getByTypeId
}
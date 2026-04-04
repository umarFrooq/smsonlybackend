const catchAsync = require("../../utils/catchAsync");
const lambdaService = require("./lambda.cronjob.service");
const en=require('../../config/locales/en')
const aeService = require('../aliexpress/ae.service')
const shypservice=require('../shippementMethods/shyp/shyp.service')
const orderStatusService=require('../orderStatus/orderStatus.service')
const voucherJob = catchAsync(async (req, res) => {
  const result = await lambdaService.voucherJob();
  // res.status(200).send("Updated successfully");
  res.sendStatus()
});

const translateProducts = catchAsync(async (req, res) => {
  const product = await lambdaService.productTranslate(req.query.lang, req.query.limit, req.query.createdAt);
  res.sendStatus(product);
});

const syncAllFeeds = catchAsync(async (req, res) => {
  const result = await aeService.syncAllFeeds();
  res.sendStatus();
});

const syncAllTranslation = catchAsync(async (req, res) => {
  const result = await aeService.syncAllTranslation();
  res.sendStatus();
});
const syncVariants = catchAsync(async (req, res) => {
  const result = await aeService.syncVariants(req.query);
  res.sendStatus(result);
});
const updateShopifyProductsCron = catchAsync(async(req,res)=>{
  const result = await lambdaService.updateShopifyProductsCron(req.query);
  res.sendStatus(result);
})
const shypOrderStatusesCronJob = catchAsync(async (req, res) => {
  const result = await shypservice.shypOrderStatusesCronJob();
  res.sendStatus(result);
});
const updateDeliveredOrdersToCompleted = catchAsync(async (req, res) => {
  const result = await orderStatusService.updateDeliveredOrdersToCompleted();
  res.sendStatus(result);
});
module.exports = {
  voucherJob,
  translateProducts,
  syncAllFeeds,
  syncAllTranslation,
  syncVariants,
  updateShopifyProductsCron,
  shypOrderStatusesCronJob,
  updateDeliveredOrdersToCompleted
}
const httpStatus = require("http-status");
const pick = require("../../utils/pick");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const sellerConfidentialDetailService = require("./sellerConfidentialDetail.service");
const en=require('../../config/locales/en')
const createSellerConfidentialDetail = catchAsync(async (req, res) => {
  const sellerConfidentialDetail = await sellerConfidentialDetailService.createSellerConfidentialDetail(req.user, req.body);

  // res.status(httpStatus.CREATED).send(sellerConfidentialDetail);
  res.sendStatus(sellerConfidentialDetail);
});

const getSellerConfidentialDetails = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["seller", "cnic_no", "bankAccountTitle", "bankAccountNumber"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await sellerConfidentialDetailService.querySellerConfidentialDetails(filter, options);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});

const getSellerConfidentialDetail = catchAsync(async (req, res) => {
  const sellerConfidentialDetail = await sellerConfidentialDetailService.getSellerConfidentialDetailById(req.params.sellerConfidentialDetailId);
  if (!sellerConfidentialDetail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_CONFIDENTIAL_MODULE.SELLER_DETAIL_NOT_FOUND');
  }
  // res.status(httpStatus.OK).send(sellerConfidentialDetail);
  res.sendStatus(sellerConfidentialDetail);
});
const currentSellerConfidentialDetail = catchAsync(async (req, res) => {
  const sellerConfidentialDetail = await sellerConfidentialDetailService.getSellerConfidentialDetailBySeller(req.user.id);
  // if (!sellerConfidentialDetail) {
  //   throw new ApiError(httpStatus.NOT_FOUND, "sellerDetail not found");
  // }
  if (!sellerConfidentialDetail) 
  // res.status(httpStatus.OK).send({});
res.sendStatus();
  else 
  // res.status(httpStatus.OK).send(sellerConfidentialDetail);
res.sendStatus(sellerConfidentialDetail);
});
const sellerConfidentialDetailBySeller = catchAsync(async (req, res) => {
  const sellerConfidentialDetail = await sellerConfidentialDetailService.getSellerConfidentialDetailBySeller(req.body.seller);
  if (!sellerConfidentialDetail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_CONFIDENTIAL_MODULE.SELLER_DETAIL_NOT_FOUND' );
  }
  // res.status(httpStatus.OK).send(sellerConfidentialDetail);
  res.sendStatus(sellerConfidentialDetail);
});
const updateSellerConfidentialDetail = catchAsync(async (req, res) => {
  const sellerDetail = await sellerConfidentialDetailService.updateSellerConfidentialDetail(
    req.params.sellerConfidentialDetailId,
    req.user,
    req.body,
  );

  // res.send(sellerDetail);
  res.sendStatus(sellerDetail);
});
const uploadImages = catchAsync(async (req, res) => {

  const sellerConfidentialDetail = await sellerConfidentialDetailService.uploadImages(req.params.sellerConfidentialDetailId, req.user, req.body, req.files);

  // res.status(httpStatus.OK).send(sellerConfidentialDetail);
  res.sendStatus(sellerConfidentialDetail);
});
const deleteSellerConfidentialDetail = catchAsync(async (req, res) => {
  await sellerConfidentialDetailService.deleteSellerConfidentialDetail(req.params.sellerConfidentialDetailId, req.user);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus();
});

const generateApiKeys = catchAsync(async (req, res) => {
  const sellerConfidentialDetail = await sellerConfidentialDetailService.generateApiKeys(req.user.id);
  // res.status(httpStatus.OK).send(sellerConfidentialDetail);
  res.sendStatus(sellerConfidentialDetail.data,sellerConfidentialDetail.status,sellerConfidentialDetail.message);
});

module.exports = {
  uploadImages,
  createSellerConfidentialDetail,
  getSellerConfidentialDetails,
  getSellerConfidentialDetail,
  updateSellerConfidentialDetail,
  currentSellerConfidentialDetail,
  deleteSellerConfidentialDetail,
  sellerConfidentialDetailBySeller,
  generateApiKeys
};

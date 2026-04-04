const httpStatus = require("http-status");
const pick = require("../../utils/pick");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const sellerDetailService = require("./sellerDetail.service");
const { statMethod, pageType } = require("../stats/stats.service");
const sanitize = require("@/utils/sanitize");
const en=require('../../config/locales/en')
const createSellerDetail = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.createSellerDetail(
    req.user,
    req.body
  );
  // res.status(httpStatus.CREATED).send(sellerDetail);
  res.sendStatus(sellerDetail);
});
const featureBrand = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.featureBrand(
    req.params.sellerDetailId, req.body
  )
  res.sendStatus(sellerDetail);
})
const getSellerDetails = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["seller", "brandName", "market", "city",'country']);
  let search = pick(req.query, ["name", "value"]);
  let options = pick(req.query, ["sortBy", "limit", "page"]);
  filter = sanitize(filter);
  search = sanitize(search);
  options = sanitize(options);
  console.log(filter);
  const result = await sellerDetailService.querySellerDetails(
    filter,
    options,
    search
  );
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});

const getSellerDetail = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.getstoreById(
    req.params.sellerDetailId
  );
  if (!sellerDetail) {
    throw new ApiError(httpStatus.NOT_FOUND,  'SELLER_DETAIL_MODULE.SELLER_DETAIL_NOT_FOUND' );
  }
  if (sellerDetail) {
    let params = {
      type: pageType.STORE,
      visitorIp: req.connection.remoteAddress,
      pageId: sellerDetail._id,
    };
    statMethod(params);
  }
  // res.status(httpStatus.OK).send(sellerDetail);
  res.sendStatus(sellerDetail);
});

const getSellerDetailBySlug = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.getstoreBySlug(
    req.params.slug
  );
  if (!sellerDetail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_DETAIL_MODULE.SELLER_DETAIL_NOT_FOUND');
  }
  if (sellerDetail) {
    let params = {
      type: pageType.STORE,
      visitorIp: req.connection.remoteAddress,
      pageId: sellerDetail._id,
    };
    statMethod(params);
  }
  // res.status(httpStatus.OK).send(sellerDetail);
  res.sendStatus(sellerDetail);
});

const currentSellerDetail = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.currentSellerDetail(
    req.user.id
  );
  if (!sellerDetail)
    // res.status(httpStatus.OK).send({});
    res.sendStatus()
  else
    // res.status(httpStatus.OK).send(sellerDetail);
    res.sendStatus(sellerDetail);
});

const updateSellerDetail = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.updateSellerDetail(
    req.params.sellerDetailId,
    req.user,
    req.body
  );
  // res.send(sellerDetail);
  res.sendStatus(sellerDetail);
});
const uploadImages = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.uploadImages(
    req.params.sellerDetailId,
    req.user,
    req.body,
    req.files
  );

  // res.status(httpStatus.OK).send(sellerDetail);
  res.sendStatus(sellerDetail);
});
const deleteSellerDetail = catchAsync(async (req, res) => {
  await sellerDetailService.deleteSellerDetail(
    req.params.sellerDetailId,
    req.user
  );
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus();
});
const getSellerDetailByUserId = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.getSellerDetailByUserId(
    req.params.sellerId
  );
  if (sellerDetail)
    // res
    //   .status(httpStatus.OK)
    //   .send({ status: 200, message: "Found", result: sellerDetail });
    res.sendStatus(sellerDetail)
  else
    // res
    //   .status(httpStatus.OK)
    //   .send({ status: 404, message: "seller not found", result: {} });
    res.sendStatus(null,404, 'SELLER_DETAIL_MODULE.SELLER_NOT_FOUND');
});

const getSellerDetailAdmin = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.getSellerDetailAndSeller(
    req.params.sellerDetailId
  );
  if (!sellerDetail)
    //  res.status(httpStatus.OK).send({});
    res.sendStatus()
  else
    // res.status(httpStatus.OK).send(sellerDetail);
    res.sendStatus(sellerDetail);
});

const rrpGenerator = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.rrpGenerator(
    req.body.sellerDetailId,
    req.user
  );
  // res.status(httpStatus.OK).send(sellerDetail);
  res.sendStatus(sellerDetail);
});
const rrpParser = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.rrpParser(
    req.user,
    req.body.storeId
  );
  // res.status(httpStatus.OK).send(sellerDetail);
  res.sendStatus(sellerDetail.data, sellerDetail.status, sellerDetail.message);
});

const generateAlias = catchAsync(async (req, res) => {
  const generate = await sellerDetailService.generateAlias(req.user, req.body.id, req.body.fullDb);
  // res.status(httpStatus.OK).send(generate);
  res.sendStatus(generate.data, generate.status, generate.message);
})
const costCodeGenerator = catchAsync(async (req, res) => {
  const sellerDetail = await sellerDetailService.costCodeGenerator();
  // res.status(httpStatus.OK).send(sellerDetail);
  res.sendStatus(sellerDetail.data, sellerDetail.status, sellerDetail.message);
});

const customerSellerDetail = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["seller", "brandName", "market", "city",'country']);
  let search = pick(req.query, ["name", "value"]);
  let options = pick(req.query, ["sortBy", "limit", "page"]);
  filter = sanitize(filter);
  search = sanitize(search);
  options = sanitize(options);
  const sellerDetail = await sellerDetailService.customerSellerDetail(filter, options, search);
  // res.status(httpStatus.OK).send(sellerDetail);
  res.sendStatus(sellerDetail);
});
const searchQuerySellerDetail = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["seller", "brandName", "market", "city","lang",'country']);
  let search = pick(req.query, ["name", "value"]);
  let options = pick(req.query, ["sortBy", "limit", "page"]);
  filter = sanitize(filter);
  search = sanitize(search);
  options = sanitize(options);
  const sellerDetail = await sellerDetailService.searchQuerySellerDetail(filter, options, search);
  // res.status(httpStatus.OK).send(sellerDetail);
  res.sendStatus(sellerDetail);
});

const storeAnalytics = catchAsync(async (req, res) => {
  const result = await sellerDetailService.storeAnalytics(req.params.sellerId);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});

const updateSlug = catchAsync(async (req, res) => {
  const result = await sellerDetailService.updateSlug();
  // res.status(httpStatus.OK).send(result);
  res.sendStatus();
});
const getBrands = catchAsync(async (req, res) => {
  const result = await sellerDetailService.getBrands(req.body.userIds);
  res.status(httpStatus.OK).send(result);
});

const storeTranslation = catchAsync(async (req, res) => {
  const result = await sellerDetailService.translateStores();
  // res.status(httpStatus.OK).send(result);
  res.sendStatus();
})
const storeCategories = catchAsync(async (req, res) => {
  const result = await sellerDetailService.storeCategories();
  res.status(httpStatus.OK).send(result); 
})
const sellerDetailAdmin = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["seller", "brandName", "market", "city", 'country']);
  let search = pick(req.query, ["name", "value"]);
  let options = pick(req.query, ["sortBy", "limit", "page"]);
  filter = sanitize(filter);
  search = sanitize(search);
  options = sanitize(options);
  const sellerDetail = await sellerDetailService.sellerDetailAdmin(filter, options, search);
  // res.status(httpStatus.OK).send(sellerDetail);
  res.sendStatus(sellerDetail);
});
const updateCommission = catchAsync(async (req, res) => {
  const result = await sellerDetailService.updateCommission(req.params.sellerDetailId,req.body.commission);
  res.status(httpStatus.OK).send(result);
})
module.exports = {
  uploadImages,
  createSellerDetail,
  getSellerDetails,
  getSellerDetail,
  updateSellerDetail,
  currentSellerDetail,
  deleteSellerDetail,
  getSellerDetailByUserId,
  getSellerDetailAdmin,
  rrpGenerator,
  rrpParser,
  generateAlias,
  costCodeGenerator,
  customerSellerDetail,
  storeAnalytics,
  updateSlug,
  getSellerDetailBySlug,
  getBrands,
  storeTranslation,
  featureBrand,
  storeCategories,
  searchQuerySellerDetail,
  sellerDetailAdmin,
  updateCommission
};

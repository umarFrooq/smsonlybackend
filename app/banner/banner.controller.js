const httpStatus = require("http-status");
const pick = require("../../utils/pick");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const bannerService = require("./banner.service");
const en=require('../../config/locales/en')
const { NO_CONTENT } = require("@/node_modules/http-status/lib/index");

const createBanner = catchAsync(async (req, res) => {

  const banner = await bannerService.createBanner(req.body,req.files);

  // res.status(httpStatus.CREATED).send(banner);
  res.sendStatus(banner);
});

const getBanners = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "type"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await bannerService.queryBanners(filter, options);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});



const getBanner = catchAsync(async (req, res) => {
  const banner = await bannerService.getBannerById(req.params.bannerId);
  if (!banner) {
    throw new ApiError(httpStatus.NOT_FOUND, 'BANNER_MODULE.BANNER_NOT_FOUND');
  }
  // res.status(httpStatus.OK).send(banner);
  res.sendStatus(banner)
});

const updateBanner = catchAsync(async (req, res) => {
  const banner = await bannerService.updateBanner(
    req.params.bannerId,
    req.body,

  );

  // res.send(banner);
  res.sendStatus(banner)
});
const uploadImages = catchAsync(async (req, res) => {

  const banner = await bannerService.uploadImages(req.params.bannerId, req.body, req.files);

  // res.status(httpStatus.OK).send(banner);
  res.sendStatus(banner)
});
const deleteBanner = catchAsync(async (req, res) => {

  await bannerService.deleteBannerById(req.params.bannerId);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus()
});

const getBannerAndBannerSet = catchAsync(async (req, res) => {

  const bannerSet = await bannerService.getBannerAndBannerSet(req.params.bannerSetId);
  // res.status(httpStatus.OK).send({bannerSet});
  res.sendStatus(bannerSet)
});
module.exports = {
  uploadImages,
  createBanner,
  getBanners,
  getBanner,
  updateBanner,
  deleteBanner,
  getBannerAndBannerSet
};

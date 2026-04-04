const catchAsync = require("../../utils/catchAsync");
const bannerSerivce = require("./banner-set.service");
const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const en=require('../../config/locales/en')
const createBannerSet = catchAsync(async (req, res) => {
    const bannerSet = await bannerSerivce.createBannerSet(req.body);
    // res.status(httpStatus.CREATED).send(bannerSet);
    res.sendStatus(bannerSet.data,bannerSet.status,bannerSet.message)
});

const getBannerSetById = catchAsync(async (req, res) => {
    const bannerSet = await bannerSerivce.getBannerSetById(req.params.bannerId);
    // res.status(httpStatus.OK).send(bannerSet);
    res.sendStatus(bannerSet)

});

const getBannerSetBySlug = catchAsync(async (req, res) => {
    const bannerSet = await bannerSerivce.getBannserSetBySlug(req.params.slug);
    // res.status(httpStatus.OK).send(bannerSet);
    res.sendStatus(bannerSet.data,bannerSet.status,bannerSet.message)
});

const updateBannerSet = catchAsync(async (req, res) => {
    const bannerSet = await bannerSerivce.updateBannerSet(req.params.bannerId, req.body);
    // res.status(httpStatus.OK).send(bannerSet);
    res.sendStatus(bannerSet.data,bannerSet.status,bannerSet.message)
});

const deleteBannerSet = catchAsync(async (req, res) => {
    const bannerSet = await bannerSerivce.deleteBannerSet(req.params.bannerId);
    // res.status(httpStatus.OK).send(bannerSet);
    res.sendStatus(bannerSet.data,bannerSet.status,bannerSet.message)
});

const getAllBannerSet = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['bannerName']);
    const search = pick(req.query, ['name', 'value']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const bannerSet = await bannerSerivce.getAllBannerSet(filter, options, search, req.user);
    // res.status(httpStatus.OK).send(bannerSet);
    res.sendStatus(bannerSet.data,bannerSet.status,bannerSet.message)
});
const getBannerAndBannerSetAdmin = catchAsync(async (req, res) => {

    const bannerSet = await bannerSerivce.getBannerAndBannerSetAdmin(req.params.bannerSetId);
    // res.status(httpStatus.OK).send({ bannerSet });
    res.sendStatus(bannerSet.data,bannerSet.status,bannerSet.message)
});

const updateBannerStatus = catchAsync(async (req, res) => {
    const bannerSet = await bannerSerivce.updateBannerStatus(req.params.bannerSetId, req.body.active);
    // res.status(httpStatus.OK).send({ status: 200, isSuccess: true, data: bannerSet, message: "Update successfully" });
    res.sendStatus()
});

const getBannerAndSet = catchAsync(async (req, res) => {
    const bannerSet = await bannerSerivce.getBannerAndSet(req.params.bannerSetId, req.user);
    // res.status(httpStatus.OK).send({ bannerSet });
    res.sendStatus(bannerSet.data,bannerSet.status,bannerSet.message)
})

const getBannerSetAndBanners = catchAsync(async (req, res) => {
    const bannerSet = await bannerSerivce.getBannerSetAndBanners(req.query);
    // res.status(httpStatus.OK).send(bannerSet);
    res.sendStatus(bannerSet)
})
module.exports = {
    createBannerSet,
    getBannerSetById,
    getBannerSetBySlug,
    updateBannerSet,
    deleteBannerSet,
    getAllBannerSet,
    getBannerAndBannerSetAdmin,
    updateBannerStatus,
    getBannerAndSet,
    getBannerSetAndBanners
}
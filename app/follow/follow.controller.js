const httpStatus = require("http-status");
const pick = require("../../utils/pick");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const followService = require("./follow.service")
const en=require('../../config/locales/en')
const createFollow = catchAsync(async (req, res) => {
    const follow = await followService.createFollow(req.body.followed, req.user, req.body.web);
    // res.status(httpStatus.OK).send(follow);
    res.sendStatus(follow);
});

const getFollowerCount = catchAsync(async (req, res) => {
    const follow = await followService.getFollowerCount(req.body.seller, req.body.id);
    if (follow)
        // res.status(httpStatus.OK).send({ status: 200, message: "Found", result: follow });
    res.sendStatus(follow);
    else
        // res.status(httpStatus.OK).send({ status: 404, message: "Count not found", result: 0 })
    res.sendStatus(0,404,'FOLLOW_MODULE.COUNT_NOT_FOUND',)
});

const deleteFollow = catchAsync(async (req, res) => {

    const follow = await followService.deleteFollow(req.body.id, req.body.followed, req.user);
    // res.status(httpStatus.OK).send({ status: 200, messsage: "Unfollowed successfully", result: null });
    res.sendStatus(follow);
});

const isUserFollowing = catchAsync(async (req, res) => {
    const follow = await followService.isUserFollowing(req.params.followed, req.user);
    if (follow)
        // res.status(httpStatus.OK).send({ status: 200, message: "Found", result: follow });
    res.sendStatus(follow);
    else
        // res.status(httpStatus.OK).send({ status: 404, message: "Not found", result: {} })
    res.sendStatus(null,404,'NOT_FOUND',)
});

const followingList = catchAsync(async (req, res) => {

    let result = await followService.followingList(req.user._id);
    // res.status(httpStatus.OK).send(result);
    res.sendStatus(result.data,result.status,result.message);
});

const unFollow = catchAsync(async (req, res) => {

    let data = await followService.unFollow(req.user._id, req.params.storeId);
    // res.status(httpStatus.OK).send({ status: 200, messsage: "Unfollowed successfully", result: {} });
    res.sendStatus();
});

module.exports = { createFollow, getFollowerCount, deleteFollow, isUserFollowing, followingList, unFollow };
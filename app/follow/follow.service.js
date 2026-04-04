const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const Follow = require('./follow.model');
const User = require("../user/user.service");
const { findByIdAndDelete } = require("../orderItem/orderItem.model");
const mongoose = require('mongoose');
const en = require('../../config/locales/en')
const createFollow = async (followed, follower, web) => {
    if (followed && follower) {
        // const isFollowed = await Follow.findOne({ followed: followed, follower: follower._id });
        const isFollowed = await isUserFollowing(followed, follower._id);
        if (!isFollowed) {
            const isSeller = await User.isSeller(followed);
            if (isSeller) {
                const newFollow = new Follow({
                    followed: followed,
                    follower: follower._id
                });
                let follow = await Follow.create(newFollow);
                follow = getUserFollowing(follow);
                if (follow && web)
                    return { followed: followed }
                else return {};
            } else {
                throw new ApiError(httpStatus.BAD_REQUEST, 'FOLLOW_MODULE.FOLLOWED_IS_NOT_A_SELLER');
            }
        } else {
            throw new ApiError(httpStatus.BAD_REQUEST, 'FOLLOW_MODULE.YOU_ALREADY_FOLLOWED_THE_SELLER');
        }
    } else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'FOLLOW_MODULE.FOLLOWER_ID_MISSING');
    }
}


const getFollowerCount = async (seller, id) => {
    if (seller) {
        return await Follow.countDocuments({ followed: id });
    } else {
        return await Follow.countDocuments({ follower: id });
    }
}

const deleteFollow = async (id, followed, follower) => {
    if (followed && follower) {
        // const isFollowed = await Follow.findOne({ followed: followed.followed, follower: follower._id });
        const isFollowed = await isUserFollowing(followed, follower._id);
        if (isFollowed) {
            id=id?id:isFollowed.id;
            let follow = await Follow.findByIdAndDelete(id);
            return isFollowed;
        } else
            throw new ApiError(httpStatus.BAD_REQUEST, 'FOLLOW_MODULE.YOU_DID_NOT_FOLLOWED_THE_SELLER');
    } else
        throw new ApiError(httpStatus.BAD_REQUEST, 'FOLLOW_MODULE.FOLLOWER_ID_MISSING');

}

const unFollow = async (user, storeId) => {
    if (!storeId) throw new ApiError(httpStatus.BAD_REQUEST, 'FOLLOW_MODULE.SOTORE_ID_IS_MISSING');
    let result = await Follow.findOneAndRemove({ follower: user, followed: storeId })
    if (!!result) return { status: 200, isSuccess: true, messsage: 'FOLLOW_MODULE.Unfollowed', result: {} }
    else throw new ApiError(httpStatus.BAD_REQUEST, 'FOLLOW_MODULE.USER_IS_NOT_FOLLOWING_THE_STORE');
}

const isUserFollowing = async (followed, follower) => {
    const result = await Follow.findOne({ followed: followed, follower: follower._id });
    return getUserFollowing(result);

}

const getUserFollowing = (result) => {
    if (!result) return;
    let seller = User.parseUser(result?.followed);
    if (!seller)
        return seller;
    result._doc.followed = seller
    return result;

}
const followingList = async (user) => {
    let result = await Follow.aggregate([
        {
            '$match': {
                'follower': mongoose.Types.ObjectId(user)
            }
        }, {
            '$group': {
                '_id': null,
                'following': {
                    '$addToSet': '$followed'
                }
            }
        }
    ])
    result = result[0];
    if (result && result.following && result.following.length) {
        return { status: 200, isSuccess: true, data: result.following, message: "OK" }
    } else return { status: 200, isSuccess: false, data: null, message: 'FOLLOW_MODULE.THIS_USER_IS_NOT_FOLLOWING_ANYONE_YET' }
}

module.exports = { createFollow, getFollowerCount, deleteFollow, isUserFollowing, followingList, unFollow, getUserFollowing };
const { createNew, findOne, updateById } = require("@/utils/generalDB.methods.js/DB.methods");
const db = require("../../config/mongoose");
const ReviewStatsModel = db.ReviewStats;
const mongoose = require("mongoose");
const en=require('../../config/locales/en')
/**
 * Create Or Update Document
 * @param {Object} payload - Mongo schema
 * @param {ObjectId} typeId - Mongo objectId 
 * @returns {Promise<ReviewStats>}
  */

const createOrUpdateStats = async (payload, typeId) => {
  if (typeId && payload) {
    let stats = await findOne(ReviewStatsModel, { typeId: typeId });
    if (stats && stats.isSuccess && stats.data && Object.keys(stats.data).length !== 0) {
      return await updateById(ReviewStatsModel, stats.data.id, payload);
    } else return createNew(ReviewStatsModel, payload);
  } else return { status: 400, isSuccess: false, data: {}, message: 'REVIEW_STATS_MODULE.TYPE_ID_OR_PAYLOAD_IS_MISSING' };
}

/**
 * Get Doucment
 * @param {ObjectId} typeId - Mongo objectId 
 * @returns {Promise<ReviewStats>}
  */
const getByTypeId = async (typeId) => {
  if (typeId) {
    return await findOne(ReviewStatsModel, { typeId: typeId });
  } else return { isSuccess: false, status: 400, message: 'ServerError' , data: {} }
}

/**
 * Get Doucment
 * @param {ObjectId} sellerDetailId - Mongo objectId 
 * @returns {Promise<ReviewStats>}
  */
const getStoreStats = async (sellerDetailId) => {
  if (sellerDetailId) {
    return await ReviewStatsModel.aggregate([{
      $match: {
        sellerDetailId: mongoose.Types.ObjectId(sellerDetailId)
      }
    },
    {
      $group: {
        _id: "$_id",
        oneStar: { $sum: "$oneStar" },
        twoStar: { $sum: "$twoStar" },
        threeStar: { $sum: "$threeStar" },
        fourStar: { $sum: "$fourStar" },
        fiveStar: { $sum: "$fiveStar" },
        orderId: { $first: "$orderId" },
        sellerDetailId: { $first: "$sellerDetailId" },
        sellerId: { $first: "$sellerId" },
        typeId: { $first: "$typeId" },
      }
    }
    ])
    // return ReviewStatsModel.aggregate([
    //   {
    //     "$facet": {
    //       "oneStar": [{
    //         $match: { $and: [{ sellerDetailId: new mongoose.Types.ObjectId(sellerDetailId) }] },
    //       }, { $sum: "oneStar" }],
    //       "twoStar": [{
    //         $match: { $and: [{ sellerDetailId: new mongoose.Types.ObjectId(sellerDetailId) }] },
    //       }, { $sum: "twoStar" }],
    //       "threeStar": [{
    //         $match: { $and: [{ sellerDetailId: new mongoose.Types.ObjectId(sellerDetailId) }] },
    //       }, { $sum: "threeStar" }],
    //       "fourStar": [{
    //         $match: { $and: [{ sellerDetailId: new mongoose.Types.ObjectId(sellerDetailId) }] },
    //       }, { $sum: "fourStar" }],
    //       "fiveStar": [{
    //         $match: { $and: [{ sellerDetailId: new mongoose.Types.ObjectId(sellerDetailId) }] },
    //       }, { $sum: "fiveStar" },
    //       ],

    //       "total": [{
    //         $match: { typeId: new mongoose.Types.ObjectId(sellerDetailId) }
    //       },

    //       { $sum: "total" }],
    //     }
    //   }
    // ]).then(results => {
    //   console.log(results[0].fiveStar)
    //   let result = {
    //     oneStar: results[0].oneStar.length > 0 ? results[0].oneStar[0].oneStar : 0,
    //     twoStar: results[0].twoStar.length > 0 ? results[0].twoStar[0].twoStar : 0,
    //     threeStar: results[0].threeStar.length > 0 ? results[0].threeStar[0].threeStar : 0,
    //     fourStar: results[0].fourStar.length > 0 ? results[0].fourStar[0].fourStar : 0,
    //     fiveStar: results[0].fiveStar.length > 0 ? results[0].fiveStar[0].fiveStar : 0,
    //     total: results[0].total.length > 0 ? results[0].total[0].total : 0,

    //   }
    //   //  calculating average stars
    //   const numberOfRating = result.oneStar + result.twoStar + result.threeStar + result.fourStar + result.fiveStar;
    //   const totalStar = result.oneStar * 1 + result.twoStar * 2 + result.threeStar * 3 + result.fourStar * 4 + result.fiveStar * 5;
    //   const avg = totalStar / numberOfRating;
    //   result["avg"] = avg ? avg : 0;
    //   return { isSuccess: true, data: result, status: 200, message: "" };
    // }).catch(err => {
    //   return { isSuccess: false, data: err, status: 400, message: "Server error" };
    // })
  } else 
  // return { isSuccess: false, data: err, status: 400, message: "Seller Detail Id is missing." };
  throw new ApiError(httpStatus.BAD_REQUEST, 'REVIEW_STATS_MODULE.SELLER_DETAIL_ID_MISSING');
}

module.exports = {
  createOrUpdateStats,
  getByTypeId,
  getStoreStats
}

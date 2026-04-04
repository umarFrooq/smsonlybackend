
const db = require("../../config/mongoose");
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const Review = db.Review;
const mongoose = require("mongoose");
const { createOrUpdateStats } = require("../review.stats/review.stats.service");
const { findOne } = require("@/utils/generalDB.methods.js/DB.methods");
const { update } = require("@/models/Shipping");
const { reviewType } = require("./review.enums");
const { updateDocument } = require('../product/typesense/typesense.service')
const Product = db.Product;
const en = require('../../config/locales/en');
const { reportActions,productTypes } = require("@/config/enums");
/**
 * Create a review
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createReview = async (reviewer, reviewBody, images) => {
  let imagesLoc;
  if (images && images.reviewImages && images.reviewImages.length) {
    imagesLoc = images.reviewImages.map(img => img.location);
    reviewBody["images"] = imagesLoc;
  }
  const rev = await Review.findOne({ reviewer, typeId: reviewBody.typeId })
  if (rev) {
    throw new ApiError(httpStatus.FORBIDDEN, 'REVIEW_MODULE.ALREADY_REVIEWED');
  }
  if (reviewBody.comment) {
    reviewBody.comment["dateTime"] = new Date();
  }
  reviewBody["reviewer"] = reviewer;
  const review = await Review.create(reviewBody);
  if (review) {
    const _reviewStats = await getRating(review.typeId);
    let reviewStats = _reviewStats.data;
    if (_reviewStats && _reviewStats.isSuccess && _reviewStats.data) {
      reviewStats["typeId"] = review.typeId;
      reviewStats["sellerId"] = reviewBody.sellerId;
      reviewStats["sellerDetailId"] = reviewBody.sellerDetailId;
      reviewStats["orderId"] = reviewBody.orderId;
    }
    const stats = await createOrUpdateStats(reviewStats, review.typeId);
    if (review && review.reviewType == reviewType.PRODUCT && stats && stats.isSuccess && stats.data) {
      const product = await Product.findById(review.typeId);
      if (product) {
        let result = await Product.findByIdAndUpdate(review.typeId, { reviewCount: stats.data.total, averageRating: stats.data.avg })
        // if (result&&result.productType==productTypes.MAIN) {
        //   updateDocument(result._id, result)
        // }
      }
    }
    console.log(stats);

  }
  return review;
};

/**
 * Get review by id
 * @param {ObjectId} id
 * @returns {Promise<Review>}
 */
const getReviewById = async (id) => {
  return Review.findOne({ _id: id });
};

const getPopulatedReview = async (id) => {
  return Review.findOne({ _id: id });
};
/**
 * Update review by id
 * @param {ObjectId} reviewId
 * @param {Object} updateBody
 * @returns {Promise<Review>}
 */
const updateReviewById = async (reviewId, reviewer, updateBody, role, images) => {
  const review = await getReviewById(reviewId);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'REVIEW_MODULE.REVIEW_NOT_FOUND');
  }

  if (images && images.reviewImages && images.reviewImages.length) {
    let imageLoc;
    let allImages = []
    imageLoc = images.reviewImages.map(img => img.location);
    if (review.images && review.images.length) {
      allImages = [...review.images, ...imageLoc];
    } else allImages = imageLoc;
    updateBody["images"] = allImages;

  }
  console.log(review.reviewer._id);
  if ((review.reviewer && review.reviewer._id.toString() == reviewer) || (review.sellerId && review.sellerId._id.toString() == reviewer)) {
    if (updateBody && updateBody.response)
      updateBody.response["dateTime"] = new Date();
    if (updateBody && updateBody.comment)
      updateBody.comment["dateTime"] = new Date();
    // Object.assign(review, updateBody);
    // review.comment=updateBody.comment;
    // review.rating=updateBody.rating;
    const getreview = await Review.findByIdAndUpdate(reviewId, updateBody, { new: true, upsert: true });
    if (getreview) {
      const _reviewStats = await getRating(getreview.typeId);
      let reviewStats = _reviewStats.data;
      if (_reviewStats && _reviewStats.isSuccess && _reviewStats.data) {
        reviewStats["typeId"] = getreview.typeId;
        reviewStats["sellerId"] = review.sellerId;
        reviewStats["sellerDetailId"] = review.sellerDetailId;
        reviewStats["orderId"] = review.orderId;
      }
      const stats = await createOrUpdateStats(reviewStats, review.typeId);
      if (getreview && getreview.reviewType == reviewType.PRODUCT && stats && stats.isSuccess && stats.data) {
        const product = await Product.findById(getreview.typeId);
        if (product) {
          let result = await Product.findByIdAndUpdate(getreview.typeId, { reviewCount: stats.data.total, averageRating: stats.data.avg })
          // if (result&&result.productType==productTypes.MAIN)
          //   updateDocument(result._id, result)
        }
      }

    }
    return getreview;

  } else throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');

};

/**
 * Delete review by id
 * @param {ObjectId} reviewId
 * @returns {Promise<Review>}
 */
const deleteReviewById = async (reviewId, reviewerId) => {
  const review = await getReviewById(reviewId);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'REVIEW_MODULE.REVIEW_NOT_FOUND');
  }
  if (review.reviewer.toString() !== reviewerId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
  }
  await review.remove();
  return review;
};

/**
 * Querying reviews with filter and options
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */

const queryReviews = async (filter, options) => {
  const reviews = await Review.paginate( filter, options);
  return reviews;
};

/**
 * Querying reviews with filter and options
 * @param {ObjectId} typeId - Mongo ObjectId
 * @returns {Promise<QueryResult>}
 */

const getRating = async (typeId) => {
  // getting individual stars
  return await Review.aggregate(([
    { $match: { reported: { $ne: reportActions.BLOCKED } } },
    {
      "$facet": {
        "oneStar": [{
          $match: { $and: [{ rating: 1 }, { typeId: new mongoose.Types.ObjectId(typeId) }] },
        }, { $count: "oneStar" }],

        "twoStar": [{
          $match: { $and: [{ rating: 2 }, { typeId: new mongoose.Types.ObjectId(typeId) }] },
        }, { $count: "twoStar" }],
        "threeStar": [{
          $match: { $and: [{ rating: 3 }, { typeId: new mongoose.Types.ObjectId(typeId) }] },
        }, { $count: "threeStar" }],
        "fourStar": [{
          $match: { $and: [{ rating: 4 }, { typeId: new mongoose.Types.ObjectId(typeId) }] },
        }, { $count: "fourStar" }],
        "fiveStar": [{
          $match: { $and: [{ rating: 5 }, { typeId: new mongoose.Types.ObjectId(typeId) }] },
        }, { $count: "fiveStar" },
        ],

        "total": [{
          $match: { $and: [{ typeId: new mongoose.Types.ObjectId(typeId) }] }
        },

        { $count: "total" }],
      }
    }
  ]
  )).then(results => {
    console.log(results[0].fiveStar)
    let result = {
      oneStar: results[0].oneStar.length > 0 ? results[0].oneStar[0].oneStar : 0,
      twoStar: results[0].twoStar.length > 0 ? results[0].twoStar[0].twoStar : 0,
      threeStar: results[0].threeStar.length > 0 ? results[0].threeStar[0].threeStar : 0,
      fourStar: results[0].fourStar.length > 0 ? results[0].fourStar[0].fourStar : 0,
      fiveStar: results[0].fiveStar.length > 0 ? results[0].fiveStar[0].fiveStar : 0,
      total: results[0].total.length > 0 ? results[0].total[0].total : 0,
    }
    //  calculating average stars
    const numberOfRating = result.oneStar + result.twoStar + result.threeStar + result.fourStar + result.fiveStar;
    const totalStar = result.oneStar * 1 + result.twoStar * 2 + result.threeStar * 3 + result.fourStar * 4 + result.fiveStar * 5;
    const avg = totalStar / numberOfRating;
    result["avg"] = avg ? avg.toFixed(2) : 0;
    return { isSuccess: true, message: "ok", data: result, status: 400 }
  }).catch(err => {

    console.log("Review Rating Error", err);
    return { isSuccess: false, message: 'SERVER_ERROR', data: {}, status: 400 }
  })
}

/**
 * Get By User And TypeId
 * @param {ObjectId} typeId - Mongo ObjectId
 * @param {ObjectId} userId - Mongo ObjectId
 * @returns {Promise<QueryResult>}
 */
const getByUserAndTypeId = async (userId, typeId) => {
  return await findOne(Review, { reviewer: userId, typeId: typeId });
}

const getReportedReview = async (filter) => {
  return await findOne(Review, { reported: filter });
}

const reviewUpdateById = async (reviewId, updateBody) => {
  const review = await Review.findByIdAndUpdate(reviewId, updateBody, { new: true });
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, "review not found");
  }
  return review;
}
module.exports = {
  createReview,
  getReviewById,
  updateReviewById,
  deleteReviewById,
  queryReviews,
  getPopulatedReview,
  getRating,
  getByUserAndTypeId,
  getReportedReview,
  reviewUpdateById
};

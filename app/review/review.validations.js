const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const createReview = {

  body: Joi.object().keys({
    typeId: Joi.required().custom(objectId),
    comment: Joi.object().allow(null, {}).keys({
      comment: Joi.string().allow(null, "")
    }),
    rating: Joi.number(),
    reviewType: Joi.string(),
    sellerId: Joi.required().custom(objectId),
    sellerDetailId: Joi.required().custom(objectId),
    orderId: Joi.required().custom(objectId),

  }),
};

const getReviews = {
  query: Joi.object().keys({
    typeId: Joi.string().custom(objectId),
    rating: Joi.number(),
    reviewer: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getReview = {
  params: Joi.object().keys({
    reviewId: Joi.string().custom(objectId),
  }),
};

const updateReview = {
  params: Joi.object().keys({
    reviewId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      response: Joi.object().allow(null, {}).keys({ response: Joi.string().allow(null, "") }),
      comment: Joi.object().allow(null, {}).keys({ comment: Joi.string().allow(null, "") }),
      rating: Joi.number(),
    })

};

const deleteReview = {
  params: Joi.object().keys({
    reviewId: Joi.string().custom(objectId),
  }),
};

const getByUserAndTypeId = {
  params: Joi.object().keys({
    typeId: Joi.string().custom(objectId),
  }),
};

const getRating = {
  params: Joi.object().keys({
    typeId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
  getByUserAndTypeId,
  getRating
};

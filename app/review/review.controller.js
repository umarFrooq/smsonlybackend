const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const reviewService = require('./review.service');
const en=require('../../config/locales/en')
const createReview = catchAsync(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body, req.files);
  // res.status(httpStatus.CREATED).send(review);
  res.sendStatus(review);
});

const getReviews = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['typeId', 'reviewer', 'rating', 'brandId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await reviewService.queryReviews(filter, options);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});

const getReview = catchAsync(async (req, res) => {
  const review = await reviewService.getPopulatedReview(req.params.reviewId);
  // if (!review) {
  //   throw new ApiError(httpStatus.NOT_FOUND, 'review not found');
  // }
  // res.status(httpStatus.OK).send({ status: 200, message: "", isSuccess: true, data: review ? review : {} });
  let data = review ? review : null
  res.sendStatus(data);
});

const updateReview = catchAsync(async (req, res) => {
  const review = await reviewService.updateReviewById(req.params.reviewId, req.user.id, req.body, req.user.role, req.files);
  // res.status(200).send({ isSuccess: true, message: "Updated Successfully", status: 200, data: review ? review : {} });
  let data = review ? review : null
  res.sendStatus(data);
});

const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReviewById(req.params.reviewId, req.user.id);
  // res.status(httpStatus.OK).send({ isSuccess: true, message: "Delete Successfully.", status: 200, data: {} });
  res.sendStatus();
});

const getRating = catchAsync(async (req, res) => {
  const rating = await reviewService.getRating(req.params.typeId);
  // res.status(httpStatus.OK).send(rating);
  res.sendStatus(rating.data, rating.status, rating.message);
});

const getByUserAndTypeId = catchAsync(async (req, res) => {
  const result = await reviewService.getByUserAndTypeId(req.user.id, req.params.typeId);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result.data, result.status, result.message);
})


module.exports = {
  createReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
  getRating,
  getByUserAndTypeId,
};

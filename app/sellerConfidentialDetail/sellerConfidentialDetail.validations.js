const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");


const createSellerConfidentialDetail = {
  body: Joi.object().keys({
    seller: Joi.string().custom(objectId),
    cnic_no: Joi.string().required(),
    bankName: Joi.string().required(),
    bankAccountTitle: Joi.string().required(),
    bankAccountNumber: Joi.string().required(),

  }),
};
const uploadImages = {
  params: Joi.object().keys({
    sellerConfidentialDetailId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    removeImages: Joi.array().items(Joi.string())
  }),
};
const sellerConfidentialDetailBySeller = {

  body: Joi.object().keys({
    seller: Joi.string().custom(objectId).required()
  }),
};

const getSellerConfidentialDetails = {
  query: Joi.object().keys({
    seller: Joi.string().custom(objectId),
    bankName: Joi.string(),
    cnic_no: Joi.string(),
    bankAccountTitle: Joi.string(),
    bankAccountNumber: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};
const getSellerConfidentialDetail = {
  params: Joi.object().keys({
    sellerConfidentialDetailId: Joi.string().custom(objectId),
  }),
};

const updateSellerConfidentialDetail = {
  params: Joi.object().keys({
    sellerConfidentialDetailId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({

    cnic_no: Joi.string(),
    bankName: Joi.string(),
    bankAccountTitle: Joi.string(),
    bankAccountNumber: Joi.string()



  }).min(1),
};

const deleteSellerConfidentialDetail = {
  params: Joi.object().keys({
    sellerConfidentialDetailId: Joi.string().custom(objectId),
  }),
};
module.exports = {
  uploadImages,
  createSellerConfidentialDetail,
  getSellerConfidentialDetails,
  getSellerConfidentialDetail,
  updateSellerConfidentialDetail,
  deleteSellerConfidentialDetail,
  sellerConfidentialDetailBySeller,
};

const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");
const { regions, platforms } = require("@/config/enums");

const createSellerDetail = {
  body: Joi.object().keys({
    seller: Joi.string().custom(objectId),
    market: Joi.string().custom(objectId),
    country: Joi.string(),
    brandName: Joi.string().required(),
    description: Joi.string().required(),
    city: Joi.string(),
    address: Joi.string(),
    cityCode: Joi.string(),
    lang: Joi.object(),
    categories: Joi.array().items(Joi.string().custom(objectId)).max(3).min(1).required(),
    country: Joi.string().valid(...Object.values(regions)),
    type:Joi.string().valid(...Object.values(platforms)),
    
    zipCode: Joi.number(),
    area: Joi.string(),
    province: Joi.string(),
  }),
};
const uploadImages = {
  params: Joi.object().keys({
    sellerDetailId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    removeImages: Joi.array().items(Joi.string()),
    removeLogo: Joi.string()
  }),
};

const featureBrand = {
  params: Joi.object().keys({
    sellerDetailId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    featured: Joi.boolean().required(),
  }),
};

const getSellerDetails = {
  query: Joi.object().keys({
    seller: Joi.string().custom(objectId).allow(null).allow("").optional(),
    market: Joi.string().allow(null).allow("").optional(),
    brandName: Joi.string().allow(null).allow("").optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    name: Joi.string().allow(null).allow("").optional(),
    value: Joi.string().allow(null).allow("").optional(),
    city: Joi.string().allow(null).allow("").optional(),
    lang: Joi.string().allow(null).allow("").optional(),
    country: Joi.string().valid(...Object.values(regions)),
  }),
};
const getSellerDetail = {
  params: Joi.object().keys({
    sellerDetailId: Joi.string().custom(objectId),
  }),
};

const getSellerDetailBySlug = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};

const updateSellerDetail = {
  params: Joi.object().keys({
    sellerDetailId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    // name: Joi.string(),
    // type:Joi.string()
    market: Joi.string().custom(objectId),
    brandName: Joi.string(),
    description: Joi.string(),
    city: Joi.string(),
    address: Joi.string(),
    cityCode: Joi.string(),
    lang: Joi.object(),
    categories: Joi.array().items(Joi.string().custom(objectId)).max(3).min(1),
    country: Joi.string().valid(...Object.values(regions)),
    zipCode: Joi.number(),
    area: Joi.string(),
    province: Joi.string(),
    premiumPercentage:Joi.number(),
    premium:Joi.boolean(),
  }),
};

const deleteSellerDetail = {
  params: Joi.object().keys({
    sellerDetailId: Joi.string().custom(objectId),
  }),
};

const getSellerDetailByUserId = {
  params: Joi.object().keys({
    sellerId: Joi.string().custom(objectId),
  }),
};
const rrpParser = {
  body: {
    storeId: Joi.string(),
  },
};
const analytics = {
  params: {
    sellerId: Joi.string().custom(objectId),
  }
}

const updateCommission = {
  params: Joi.object().keys({
    sellerDetailId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    commission: Joi.number().required(),
  }),
}
module.exports = {
  uploadImages,
  createSellerDetail,
  getSellerDetails,
  getSellerDetail,
  updateSellerDetail,
  deleteSellerDetail,
  getSellerDetailByUserId,
  rrpParser,
  analytics,
  getSellerDetailBySlug,
  featureBrand,
  updateCommission
};

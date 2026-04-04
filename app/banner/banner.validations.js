const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");


const createBanner = {
  body: Joi.object().keys({
    // name: Joi.string().required(),
    bannerSetId: Joi.string().custom(objectId).required(),
    name: Joi.string().required(),
    type: Joi.string(),
    linkId: Joi.string(),
    url: Joi.string(),
    bannerImage: Joi.string(),
    lang: Joi.object()
  }),
};
const uploadImages = {
  params: Joi.object().keys({
    bannerId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    removeImages: Joi.array().items(Joi.string())
  }),
};

const getBanners = {
  query: Joi.object().keys({
    name: Joi.string(),
    type: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    bannerSetId: Joi.string().custom(objectId)
  }),
};
const getBanner = {
  params: Joi.object().keys({
    bannerId: Joi.string().custom(objectId),
  }),
};

const updateBanner = {
  params: Joi.object().keys({
    bannerId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    type: Joi.string(),
    linkId: Joi.string(),
    url: Joi.string(),
    status: Joi.boolean(),
    lang: Joi.object()
  }),
};

const deleteBanner = {
  params: Joi.object().keys({
    bannerId: Joi.string().custom(objectId),
  }),
};
module.exports = {
  uploadImages,
  createBanner,
  getBanners,
  getBanner,
  updateBanner,
  deleteBanner,
};

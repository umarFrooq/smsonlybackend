const Joi = require('joi');
const { objectId } = require("../auth/custom.validation");
const { regions } = require('@/config/enums');

const productStore = {
  query: Joi.object().keys({
    removeProduct: Joi.boolean(),
    images: Joi.boolean(),
    userId: Joi.string().custom(objectId),
  }),
}

const updateProductRegions = {
  body: Joi.object().keys({
    region: Joi.array().items(Joi.string().valid(...Object.values(regions))),
    origin: Joi.string().valid(...Object.values(regions)),
    aliExpress: Joi.boolean()
  })
}
module.exports = {
  productStore,
  updateProductRegions
}

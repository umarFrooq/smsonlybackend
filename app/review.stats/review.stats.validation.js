const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");

const getByTypeId = {
  params: Joi.object().keys({
    typeId: Joi.string().custom(objectId).required()
  })
}

const getByStoreId = {
  params: Joi.object().keys({
    sellerDetailId: Joi.string().custom(objectId).required()
  })
}

module.exports = {
  getByTypeId,
  getByStoreId
}
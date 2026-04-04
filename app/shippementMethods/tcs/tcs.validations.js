const Joi = require("joi");
const { objectId } = require("../../auth/custom.validation");

const placeOrder = {
  body: Joi.object().keys({
    consigneeName: Joi.string().required(),
    consigneeAddress: Joi.string().required(),

    consigneeMobNo: Joi.string().required(),
    consigneeEmail: Joi.string().required(),
    destinationCityName: Joi.string().required(),
    weight: Joi.number().required(),
    pieces: Joi.number().required(),
    codAmount: Joi.string().required(),
  }),
};

module.exports = {
  placeOrder,
};

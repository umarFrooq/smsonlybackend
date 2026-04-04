const Joi = require("joi");
const { objectId, emptyVal } = require("../auth/custom.validation");
const myCustomJoi = Joi.extend(require("joi-phone-number"));
const createAddress = {
  body: Joi.object().keys({
    fullname: Joi.string().custom(emptyVal).min(3).max(50).required(),
    phone: myCustomJoi.string().custom(emptyVal).phoneNumber().required(),
    province: Joi.string().custom(emptyVal),
    addressType: Joi.string().custom(emptyVal),
    city: Joi.string().custom(emptyVal).min(2).max(30).required(),
    city_code: Joi.string().custom(emptyVal),
    address: Joi.string().custom(emptyVal).min(10).max(200).required(),
    country: Joi.string().custom(emptyVal).min(4).max(30),
    state: Joi.string().custom(emptyVal).min(3).max(30),
    localType: Joi.string().custom(emptyVal),
    zipCode: Joi.string().custom(emptyVal).min(4).max(10),
    addressLine_2: Joi.string().custom(emptyVal),
    landMark: Joi.string().custom(emptyVal),
    lang: Joi.object(),
    // area:Joi.string().required()
  }),
};
// const updateAddress = {
//   body: Joi.object().keys({
//     product:Joi.string().custom(objectId).required(),

//   }),
// };

const updateAddress = {
  params: Joi.object().keys({
    addressId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      fullname: Joi.string(),
      phone: myCustomJoi.string().phoneNumber(),
      province: Joi.string(),
      addressType: Joi.string(),
      city: Joi.string(),
      city_code: Joi.string(),
      address: Joi.string(),
      localType: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      zipCode: Joi.number().allow(null),
      addressLine_2: Joi.string().allow(null, ""),
      landMark: Joi.string(),
      lang: Joi.object(),
      area:Joi.string()
    })
    .min(1),
};

const deleteAddress = {
  params: Joi.object().keys({
    addressId: Joi.string().custom(objectId),
  }),
};

const getUserAddresses = {
  params: Joi.object().keys({
    phone: myCustomJoi.string().phoneNumber().required(),
  }),
};

const createAsAdmin = {
  params: Joi.object().keys({
    phone: myCustomJoi.string().phoneNumber().required(),
  }),
  body: Joi.object().keys({
    fullname: Joi.string().required(),
    phone: myCustomJoi.string().phoneNumber().required(),
    province: Joi.string(),
    addressType: Joi.string(),
    city: Joi.string().required(),
    city_code: Joi.string(),
    address: Joi.string().required(),
    country: Joi.string().allow(null),
    state: Joi.string().allow(null),
    localType: Joi.string(),
    zipCode: Joi.number().allow(null),
    addressLine_2: Joi.string().allow(null, ""),
    landMark: Joi.string(),
    area:Joi.string().required()
  }),
};
const updateAsAdmin = {
  params: Joi.object().keys({
    phone: myCustomJoi.string().phoneNumber().required(),
  }),

  body: Joi.object()
    .keys({
      addressId: Joi.string().custom(objectId).required(),
      fullname: Joi.string(),
      phone: myCustomJoi.string().phoneNumber(),
      province: Joi.string(),
      addressType: Joi.string(),
      city: Joi.string(),
      city_code: Joi.string(),
      address: Joi.string(),
      country: Joi.string().allow(null),
      state: Joi.string().allow(null),
      localType: Joi.string(),
      zipCode: Joi.number().allow(null),
      addressLine_2: Joi.string().allow(null, ""),
      landMark: Joi.string(),
    })
    .min(2),
};

module.exports = {
  createAddress,
  updateAddress,
  deleteAddress,
  getUserAddresses,
  createAsAdmin,
  updateAsAdmin,
};

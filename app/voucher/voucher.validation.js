const Joi = require("joi");
const { objectId } = require('../auth/custom.validation');
const { voucherStatuses, adminDiscountTypes, couponTypes, voucherTypes } = require("@/config/enums");
const createVoucher = {
  body: Joi.object().keys({
    title: Joi.string().min(4).max(50).required(),
    description: Joi.string().min(10).max(250),
    startDate: Joi.date().less(Joi.ref("endDate")),
    endDate: Joi.date().required(),
    amount: Joi.when('discountType', {
      is: Joi.string().valid(adminDiscountTypes.PERCENTAGE),
      then: Joi.number().less(101).greater(0).positive().required(),
      otherwise: Joi.number().positive().greater(0).required()
    }),
    numOfVouchers: Joi.number(),
    discountType: Joi.string().valid(...Object.values(adminDiscountTypes)),
    type: Joi.string().valid(...Object.values(voucherTypes)),
    couponTypeId: Joi.when("type", {
      is: Joi.string().valid(voucherTypes.COUPON),
      then: Joi.string().custom(objectId).required(),
      otherwise: Joi.string().custom(objectId)
    }),
    couponType: Joi.when("type", {
      is: Joi.string().valid(voucherTypes.COUPON),
      then: Joi.string().required().valid(...Object.values(couponTypes)),
      otherwise: Joi.string()
    }),
    voucher: Joi.string().min(4).max(15),
    // voucher: Joi.when("type", {
    //   is: Joi.string().valid(voucherTypes.COUPON),
    //   then: Joi.string().required().min(4).max(15),
    //   otherwise: Joi.string()
    // }),
    limit: Joi.number().min(1),
    quantity: Joi.number().min(1),
    lang: Joi.object()
  })
}

const updateVoucher = {
  params: {
    voucherId: Joi.string().custom(objectId).required()
  },
  body: Joi.object().keys({
    title: Joi.string().min(4).max(50).required(),
    description: Joi.string().min(10).max(250),
    status: Joi.string().valid(...Object.values(voucherStatuses)),
    numOfVouchers: Joi.number(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    discountType: Joi.string().valid(...Object.values(adminDiscountTypes)),
    voucher: Joi.string().min(4).max(15),
    limit: Joi.number().min(1),
    quantity: Joi.number().min(1),
    lang: Joi.object()
    // type: Joi.string().valid(...Object.values(voucherTypes)),
    // couponTypeId: Joi.when("type", {
    //   is: Joi.string().valid(voucherTypes.COUPON),
    //   then: Joi.string().custom(objectId).required(),
    //   otherwise: Joi.string().custom(objectId)
    // }),
    // couponType: Joi.when("type", {
    //   is: Joi.string().valid(voucherTypes.COUPON),
    //   then: Joi.string().required().valid(...Object.values(couponTypes)),
    //   otherwise: Joi.string()
    // })
  }).min(1)
}

const getVoucherById = {
  params: {
    voucherId: Joi.string().custom(objectId).required()
  }
}

const getVouchers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer(),
    to: Joi.date(),
    from: Joi.date(),
    status: Joi.string().valid(...Object.values(voucherStatuses)),
    sortBy: Joi.string(),
    discountType: Joi.string().valid(...Object.values(adminDiscountTypes)),
    type: Joi.string().valid(...Object.values(voucherTypes)),
    couponType: Joi.string().valid(...Object.values(couponTypes)),

  })
}

const getByVoucher = {
  params: {
    voucher: Joi.string().required()
  }
}

const getUserVouchers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer(),
    sortBy: Joi.string(),
    type: Joi.string().valid(...Object.values(voucherTypes)),
    couponType: Joi.string().valid(...Object.values(couponTypes)),

  })
}
module.exports = {
  createVoucher,
  updateVoucher,
  getVoucherById,
  getVouchers,
  getByVoucher,
  getUserVouchers
}
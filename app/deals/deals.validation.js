const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");
const { groupBuyEnum } = require("@/config/enums");
// const { groupBuyEnum } = require('../groupBy/group_buy.enums')

const createDeal = {
  body: Joi.object().keys({
    startDate: Joi.date().less(Joi.ref("endDate")).required(),
    endDate: Joi.date().required(),
    name: Joi.string().required().min(3).max(30),
    products: Joi.array().items(Joi.string().custom(objectId)).required(),
    limit: Joi.number().min(1),
    discountType: Joi.string().valid("price","percentage").required(),
    discount: Joi.when("discountType", {
      is: Joi.string().valid("price"),
      then: Joi.number().required().min(1),
      otherwise: Joi.number().required().min(1).max(99),
    }),
    minOrderAmount: Joi.number()
  }),
};

const updateDeal = {
  params: Joi.object().keys({
    dealId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    // startDate: Joi.date().less(Joi.ref("endDate")).required(),
    // endDate: Joi.date().required(),
    name: Joi.string().min(3).max(30),
    products: Joi.array().items(Joi.string().custom(objectId)),
    limit: Joi.number(),
    status: Joi.string().valid(...Object.values(groupBuyEnum)),
    discountType: Joi.string().valid("price","percentage"),
    discount: Joi.when("discountType", {
      is: Joi.string().valid("price"),
      then: Joi.number().min(1),
      otherwise: Joi.number().min(1).max(99),
    }),
  }),
};

const getAdminDeal = {
  query: Joi.object().keys({
    startDate: Joi.date(),
    endDate: Joi.date(),
    status: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    name: Joi.string(),
    value: Joi.string(),
  }),
}

const updateStatuses = {
  query:  Joi.object().keys({
    auth: Joi.string().required()
  })
}

const deleteDeal = {
  params: Joi.object().keys({
    dealId: Joi.string().custom(objectId).required(),
  })
}

const getDeal = {
  params: Joi.object().keys({
    dealId: Joi.string().custom(objectId).required(),
  })
}

module.exports = {
    createDeal,
    updateDeal,
    getAdminDeal,
    updateStatuses,
    deleteDeal,
    getDeal
}


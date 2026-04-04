const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');
const { pageType } = require('../stats/stats.enums');

const getVisitStats = {
  query: Joi.object().keys({
    pageId: Joi.string().custom(objectId),
    type: Joi.string().valid(pageType.STORE, pageType.CATEGORY, pageType.PRODUCT, pageType.STORE),
    from: Joi.string(),
    to: Joi.string(),
    single: Joi.bool()
  })
}

const getOrderStats = {
  query: Joi.object().keys({
    seller: Joi.string().custom(objectId),
    // status : Joi.string(),
    from: Joi.string(),
    to: Joi.string(),
    // single : Joi.bool()
  }),
};

module.exports = {
  getOrderStats,
  getVisitStats
}
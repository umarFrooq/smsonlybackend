const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const sellerCatalog = {
  body: Joi.object().keys({
    pageId: Joi.string(),
    catalogId: Joi.string(),
    businessId: Joi.string(),
    fbToken: Joi.string().required()

  }),
};

module.exports = {
  sellerCatalog
}
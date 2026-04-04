const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const fbRefreshToken = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    userId: Joi.string().custom(objectId).required()


  })
}
const getFbBussinesId = {
  query: Joi.object().keys({
    fbToken: Joi.string().required(),

  })
}

const getUserPageList = {
  query: Joi.object().keys({
    fbToken: Joi.string().required(),
    userId: Joi.string().required()

  })
}

module.exports = {
  fbRefreshToken,
  getFbBussinesId,
  getUserPageList
}
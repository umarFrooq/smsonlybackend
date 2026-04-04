const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");

const findUserNotification = {
    params: Joi.object().keys({
      userId: Joi.string().custom(objectId).required(),
      sortBy:Joi.number(),
      limit: Joi.string(),
      page: Joi.string(),
    }),
  };


  module.exports = {findUserNotification}
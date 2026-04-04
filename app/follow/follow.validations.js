const { boolean } = require("joi");
const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");

const createFollow = {
    body: Joi.object().keys({
        followed: Joi.string().custom(objectId).required(),
        web: Joi.boolean()
    }),

};

const getFollow = {
    body: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
        seller: Joi.boolean().required(),
    }),
}

const deleteFollow = {
    body: Joi.object().keys({
        followed: Joi.string().custom(objectId).required(),
    }),
    params: Joi.object().keys({
        followed: Joi.string().custom(objectId),
    }),
}

const _deleteFollow = {
    body: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
        followed: Joi.string().custom(objectId).required(),
    }),
}
const isUserFollowing = {
    params: Joi.object().keys({
        followed: Joi.string().custom(objectId),
    }),
}
const unFollow = {
    params: Joi.object().keys({
        storeId: Joi.string().custom(objectId).required(),
    }),
}
module.exports = { createFollow, getFollow, deleteFollow, isUserFollowing, _deleteFollow, unFollow };
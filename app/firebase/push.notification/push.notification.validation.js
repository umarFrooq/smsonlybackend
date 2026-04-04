const { roleTypes } = require("@/config/enums");
const Joi = require("joi");
const { join } = require("path");
const { objectId } = require("../../auth/custom.validation");

const createOrUpdate = {
    body: Joi.object().keys({
        token: Joi.string().required(),
        userId: Joi.string().custom(objectId),
        app: Joi.string()
    }),
}
const sendPushNotification = {
    body: Joi.object().keys({
        title: Joi.string().required(),
        body: Joi.string().required(),
        seller: Joi.boolean(),
        customer: Joi.boolean(),
        data: Joi.object()
    })
}

const sendOneNotification = {
    body: Joi.object().keys({
    payload: {
        userId: Joi.string().required().custom(objectId),
            role: Joi.string().required().valid(...Object.values(roleTypes)),
        token: Joi.string(),
    },
    data: {
        title: Joi.string().required(),
        body: Joi.string().required(),
    },
        notificationMeta: Joi.object(),
        token: Joi.string(),
})
}
module.exports = {
    createOrUpdate,
    sendPushNotification,
    sendOneNotification
}
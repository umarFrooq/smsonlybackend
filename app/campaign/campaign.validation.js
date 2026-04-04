const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");
const { emailType } = require("@/config/enums");


const sendPromotionalEmail = {
    body: Joi.object().keys({
        userId: Joi.string().custom(objectId),
        subject: Joi.string().required(),
        body: Joi.string().required(),
        type: Joi.string().required().valid(...Object.values(emailType))
    })
}

const getEmailById = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId)
    })
}

const getPromotionalEmails = {
    query: Joi.object().keys({
        type: Joi.string().valid(...Object.values(emailType)),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    })
}

module.exports = {
    sendPromotionalEmail,
    getEmailById,
    getPromotionalEmails
}
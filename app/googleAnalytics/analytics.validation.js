const Joi = require("joi");


const googleAnalytics = {
    body: Joi.object().keys({
        metrics: Joi.array().required()
    }).unknown(true)

};
const topKeyWords = {
    query: Joi.object().keys({
        to: Joi.string().required(),
        from: Joi.string().required(),
        limit: Joi.number(),
        siteUrl: Joi.string().required(),
    })

};
const googleEventNames = {
    query: Joi.object().keys({
        to: Joi.string().required(),
        from: Joi.string().required(),
        type: Joi.string()
    })
}
const googleAnalyticsV2 = {
    body: Joi.object().keys({
        to: Joi.string().required(),
        from: Joi.string().required(),
        metrics: Joi.array(),
        events: Joi.array()
    })

};
module.exports = {
    googleAnalytics,
    topKeyWords,
    googleAnalyticsV2,
    googleEventNames
}
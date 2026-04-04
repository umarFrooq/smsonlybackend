const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");


const createBannerSet = {
    body: Joi.object().keys({
        bannerName: Joi.string().required(),
        location: Joi.string().required(),
        active: Joi.boolean().required(),
        type: Joi.string().required(),
        device: Joi.string().required(),
        lang: Joi.object()
    }),
};

const getBannerSetById = {
    params: Joi.object().keys({
        bannerId: Joi.string().custom(objectId).required(),
    }),
};
const getBannerSetBySlug = {
    params: Joi.object().keys({
        slug: Joi.string().required(),
    }),
};

const updateBannetSet = {
    params: Joi.object().keys({
        bannerId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        bannerName: Joi.string(),
        location: Joi.string(),
        active: Joi.boolean(),
        type: Joi.string(),
        lang: Joi.object()
    }),
};

const deleteBannerSet = {
    params: Joi.object().keys({
        bannerId: Joi.string().custom(objectId).required(),
    }),
};

const getAllBannerSet = {
    query: Joi.object().keys({
        bannerName: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
        name: Joi.string(),
        value: Joi.string(),
    })
}

const getBannerAndSetById = {
    params: Joi.object().keys({
        bannerSetId: Joi.string().custom(objectId).required(),
    }),
};

const updateBannerStatus = {
    params: Joi.object().keys({
        bannerSetId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        active: Joi.boolean().required(),
    })
};
const getBannerAndSet = {
    params: Joi.object().keys({
        bannerSetId: Joi.string().custom(objectId).required(),
    }),
};

const getAllBannerSetAndBanners = {
    query: Joi.object().keys({
        bannerName: Joi.array().items(Joi.string()),
    })
}

module.exports = {
    createBannerSet,
    getBannerSetById,
    getBannerSetBySlug,
    updateBannetSet,
    deleteBannerSet,
    getAllBannerSet,
    getBannerAndSetById,
    updateBannerStatus,
    getBannerAndSet,
    getAllBannerSetAndBanners
}
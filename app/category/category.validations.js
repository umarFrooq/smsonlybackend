const Joi = require("joi");
const { join } = require("path");
const { objectId } = require("../auth/custom.validation");
const { catLocation } = require("@/config/enums");

// const createCategory = {
//   body: Joi.object().keys({
//     name: Joi.string().required(),

//     description: Joi.string().required(),
//     mainCategory:Joi.string().custom(objectId).allow(null)
//   }),
// };
const createCategory = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    commission: Joi.number().required(),
    description: Joi.string().allow(null),
    mainCategory: Joi.string().custom(objectId).allow(null),
    attributes: Joi.array(),
    attributeRequired: Joi.boolean(),
    lang: Joi.object(),
    location: Joi.array().items(Joi.string().valid(...Object.values(catLocation))),   
  }),
};
const uploadImages = {
  params: Joi.object().keys({
    categoryId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    removeImages: Joi.array().items(Joi.string()),
    lang: Joi.string()

  }),
};

const getCategories = {
  query: Joi.object().keys({
    name: Joi.string(),
    platform: Joi.string(),
    commission: Joi.number(),
    location: Joi.array().items(Joi.string().valid(...Object.values(catLocation))),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    featured:Joi.boolean()
  }),
};

const getCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().custom(objectId),
  }),
};

const getBySlug = {
  params: Joi.object().keys({
    slug: Joi.string().required()
  })
}

const updateCategory = {
  params: Joi.object().keys({
    categoryId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string(),
    commission: Joi.number(),
    attributes: Joi.array(),
    attributeRequired: Joi.boolean(),
    // parent:Joi.string().custom(objectId).allow(null),
    // removeImages:Joi.array().items(Joi.string()).allow(null)
    lang: Joi.object(),
    platformIds: Joi.array(),
    featured:Joi.boolean(),
    location: Joi.array()
  }),
}
const deleteCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().custom(objectId),
  }),
};

const findSubCategories = {
  body: Joi.object().keys({
    categories: Joi.array().items(Joi.string().custom(objectId)).required()
  })
}
const subCategories = {
  query: Joi.object().keys({
    platformId: Joi.string(),
    _id: Joi.string().custom(objectId),
})
}
const mapAeCategories = {
  params : Joi.object().keys({
    categoryId : Joi.string().custom(objectId),
  }),
  body:Joi.object().keys({
    platformIds : Joi.array().required()
  })
}
const categoryIndex = {
  body: Joi.object().keys({
    categoriesIndexes: Joi.array().items({
      categoryId: Joi.string().custom(objectId),
      index: Joi.number().invalid(0) 
    }).required()
  })
}
module.exports = {
  uploadImages,
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getBySlug,
  findSubCategories,
  subCategories,
  mapAeCategories,
  categoryIndex
};

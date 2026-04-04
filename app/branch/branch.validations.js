const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");
const {braches}=require('../../config/enums')
const createBranch = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    // head: Joi.string().custom(objectId),
    address: Joi.object().required(),
    branchCode: Joi.string().trim(), // Will be auto-generated if not provided and name exists
    type: Joi.string().valid(...Object.values(braches)).required(),
    status: Joi.string().valid('active', 'inactive').default('active'),
    schoolId: Joi.string().custom(objectId).optional(), // For rootUser creating branch for a specific school
  }),
};

const getBranches = {
  query: Joi.object().keys({
    // name: Joi.string().allow('', null), // Replaced by 'search'
    // branchCode: Joi.string().allow('', null), // Replaced by 'search'
    search: Joi.string().allow('', null).description('Search term for name and branchCode'),
    status: Joi.string().valid('active', 'inactive', '').allow(null).description('Filter by branch status'),
    type: Joi.string().valid(...Object.values(braches), '').allow(null).description('Filter by branch type'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string().allow('', null),
    schoolId: Joi.string().custom(objectId).optional().description('Filter by school ID (for rootUser)'),
  }),
};

const getBranch = {
  params: Joi.object().keys({
    branchId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({ // Allow populate & schoolId for getBranch
    populate: Joi.string().allow('', null),
    schoolId: Joi.string().custom(objectId).optional(),
  }),
};

const updateBranch = {
  params: Joi.object().keys({
    branchId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      address: Joi.object(),
      branchCode: Joi.string().trim(),
      type: Joi.string().valid(...Object.values(braches)),
      status: Joi.string().valid('active', 'inactive'),
      schoolIdToScopeTo: Joi.string().custom(objectId).optional(), // For rootUser scoping update
    })
    .min(1),
};

const deleteBranch = {
  params: Joi.object().keys({
    branchId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch,
};

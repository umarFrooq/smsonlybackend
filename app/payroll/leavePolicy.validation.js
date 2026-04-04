const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const createLeavePolicy = {
  body: Joi.object().keys({
    school: Joi.string().custom(objectId).required(),
    // branch removed: policy applies to all branches of a school
    leaveTypes: Joi.array()
      .items(
        Joi.object().keys({
          name: Joi.string().required(),
          leavesPerMonth: Joi.number().min(0).required(),
          paid: Joi.boolean(),
        })
      )
      .min(1)
      .required(),
  }),
};

const getLeavePolicies = {
  query: Joi.object().keys({
    school: Joi.string().custom(objectId),
    branch: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getLeavePolicy = {
  params: Joi.object().keys({
    leavePolicyId: Joi.string().custom(objectId),
  }),
};

const updateLeavePolicy = {
  params: Joi.object().keys({
    leavePolicyId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      school: Joi.string().custom(objectId),
      leaveTypes: Joi.array().items(
        Joi.object().keys({
          name: Joi.string().required(),
          leavesPerMonth: Joi.number().min(0).required(),
          paid: Joi.boolean(),
        })
      ),
    })
    .min(1),
};

const deleteLeavePolicy = {
  params: Joi.object().keys({
    leavePolicyId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createLeavePolicy,
  getLeavePolicies,
  getLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
};

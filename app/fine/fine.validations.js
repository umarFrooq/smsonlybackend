const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");
const fineStatusEnum = ['pending', 'paid', 'waived'];

const issueFine = {
  body: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    type: Joi.string().required().trim(),
    description: Joi.string().required().trim(),
    amount: Joi.number().min(0).required(),
    relatedFeeId: Joi.string().custom(objectId).allow(null, ''), // Optional
    // issuedBy will be set from req.user
  }),
};

const getFines = {
  query: Joi.object().keys({
    studentId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    type: Joi.string().trim(),
    status: Joi.string().valid(...fineStatusEnum),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(), // e.g., "studentId:fullname,branchId:name"
  }),
};

const getFine = {
  params: Joi.object().keys({
    fineId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    populate: Joi.string(),
  }),
};

const updateFineStatus = {
  params: Joi.object().keys({
    fineId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid('paid', 'waived').required(), // Only these can be set via this endpoint
      paymentDate: Joi.date().iso().when('status', {
        is: 'paid',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null, ''),
      }),
      paymentTransactionId: Joi.string().trim().allow(null, '').when('status', {
        is: 'paid',
        then: Joi.optional(),
        otherwise: Joi.forbidden(), // Not allowed if not 'paid'
      }),
      waiveReason: Joi.string().trim().when('status', {
        is: 'waived',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null, ''),
      }),
      // waivedBy will be set from req.user if status is 'waived'
    })
    .min(1),
};

module.exports = {
  issueFine,
  getFines,
  getFine,
  updateFineStatus,
};

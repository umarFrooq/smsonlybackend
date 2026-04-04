const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const createSalary = {
  body: Joi.object().keys({
    teacherId: Joi.string().custom(objectId).required(),
    schoolId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    basic: Joi.number().required(),
    allowances: Joi.array().items(
      Joi.object().keys({
        title: Joi.string().allow('', null),
        amount: Joi.number().min(0).required(),
        description: Joi.string().allow('', null),
      })
    ),
    deductions: Joi.array().items(
      Joi.object().keys({
        title: Joi.string().allow('', null),
        amount: Joi.number().min(0).required(),
        description: Joi.string().allow('', null),
      })
    ),
    bonuses: Joi.array().items(
      Joi.object().keys({
        title: Joi.string().allow('', null),
        amount: Joi.number().min(0).required(),
        description: Joi.string().allow('', null),
      })
    ),
  }),
};

const getSalaries = {
  query: Joi.object().keys({
    teacherId: Joi.string().custom(objectId),
    schoolId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getSalary = {
  params: Joi.object().keys({
    salaryId: Joi.string().custom(objectId),
  }),
};

const updateSalary = {
  params: Joi.object().keys({
    salaryId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
        basic: Joi.number(),
        allowances: Joi.array().items(
          Joi.object().keys({
            title: Joi.string().allow('', null),
            amount: Joi.number().min(0).required(),
            description: Joi.string().allow('', null),
          })
        ),
        deductions: Joi.array().items(
          Joi.object().keys({
            title: Joi.string().allow('', null),
            amount: Joi.number().min(0).required(),
            description: Joi.string().allow('', null),
          })
        ),
        bonuses: Joi.array().items(
          Joi.object().keys({
            title: Joi.string().allow('', null),
            amount: Joi.number().min(0).required(),
            description: Joi.string().allow('', null),
          })
        ),
    })
    .min(1),
};

const deleteSalary = {
  params: Joi.object().keys({
    salaryId: Joi.string().custom(objectId),
  }),
};

module.exports = {
    createSalary,
    getSalaries,
    getSalary,
    updateSalary,
    deleteSalary,
};

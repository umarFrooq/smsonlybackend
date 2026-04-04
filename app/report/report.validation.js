const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");
const { reportTypes,comment,reportActions} = require('@/config/enums');

const createReport = {
  body: Joi.object().keys({
    type: Joi.string().valid(...Object.values(reportTypes)).required(),
    userId: Joi.string().custom(objectId),
    typeId: Joi.string().custom(objectId).required(),
    comment: Joi.string()
    .trim().required().min(1).max(300)
})
}


const getRepById = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const   createAction= {
  body: Joi.object().keys({
    reportId: Joi.string().custom(objectId).required(),
    action:Joi.string().valid(...Object.values(reportActions)).required(),
  
   
  }),
}

const getAllAdmin = {
  query: Joi.object()
    .keys({
      type: Joi.string(),
      typeId: Joi.string().custom(objectId),
      userId: Joi.string().custom(objectId),
      mainRef:Joi.string().custom(objectId),
      limit: Joi.number(),
      page: Joi.number(),
      sortBy: Joi.string(),
      to: Joi.date(),
      from: Joi.date().when(Joi.ref("to"), {
        then: Joi.date().less(Joi.ref("to"))
      }),
    })
    .min(1),
};



module.exports = {
  createReport,
  getRepById,
  createAction,
  getAllAdmin,
};

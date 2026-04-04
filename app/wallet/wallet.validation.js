const Joi = require('joi');
const { password, objectId } = require('../auth/custom.validation');

const createWalletPin = {
    body: Joi.object().keys({
      pin: Joi.string().length(4).regex(/^\d+$/).required().required(),
      confirmPin: Joi.string().length(4).regex(/^\d+$/).required().required()
    })
  }

  const updateWalletPin = {
    body: Joi.object().keys({
      enabled : Joi.boolean(),
      newPin : Joi.string().length(4).regex(/^\d+$/).required(),
      oldPin: Joi.when('newPin',{
        is: Joi.exist(),
        then: Joi.string().length(4).regex(/^\d+$/).required().required(),
        otherwise: Joi.string().length(4).regex(/^\d+$/).required()
      }),
      confirmPin: Joi.when('newPin',{
        is: Joi.exist(),
        then: Joi.string().length(4).regex(/^\d+$/).required().required(),
        otherwise: Joi.string().length(4).regex(/^\d+$/).required()
      }),
  
    })
  }

  
const forgetPinValidator = {
  body: Joi.object().keys({
    code: Joi.string().length(4).regex(/^\d+$/).required(),
    trackingId: Joi.string().required(),
    pin: Joi.string().length(4).regex(/^\d+$/).required().required(),
    confirmPin: Joi.string().length(4).regex(/^\d+$/).required().required()
  })
}

const forgetPinSmsGeneration = {

  user: Joi.object().keys({
    phone: Joi.string()
  }).unknown(),
  body: Joi.object().keys({
    phone: Joi.when('user', {
    is: Joi.object().keys({
      phone: Joi.exist()
    }),
    then:  Joi.string() ,
    otherwise: Joi.string().required() 
  })
})
};


//   user: Joi.object().keys({
//     phone: Joi.string()
//   }).unknown(),
//   body: Joi.object().keys({
//     phone: Joi.string()
//   }).when('user', {
//     is: Joi.object().keys({
//       phone: Joi.exist()
//     }),
//     then: Joi.object({ phone: Joi.string() }),
//     otherwise: Joi.object({phone: Joi.required()}).required()
//   })
// };


module.exports= {
    createWalletPin,
    updateWalletPin,
    forgetPinValidator,
    forgetPinSmsGeneration
}
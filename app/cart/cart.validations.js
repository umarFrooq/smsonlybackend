const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const addToCart = {
  body: Joi.object().keys({
    product: Joi.string().custom(objectId).required(),
    quantity: Joi.number().required(),

  }),
};
const removeItemFromCart = {
  body: Joi.object().keys({
    product: Joi.string().custom(objectId),
    _package: Joi.string().custom(objectId).required(),
    packageItemId: Joi.string().custom(objectId)
  }).min(2).max(2),
};
const removePackageFromCart = {
  body: Joi.object().keys({
    _package: Joi.string().custom(objectId).required(),

  }),
};
const unloadPackageFromCart = {
  body: Joi.object().keys({
    _package: Joi.string().custom(objectId).required(),

  }),
};
const deletePackageFromCart = {
  body: Joi.object().keys({
    _package: Joi.string().custom(objectId).required(),

  }),
};

const adminCart = {
  body: Joi.object().keys({
    phoneNumber: Joi.string().required(),
    product: Joi.string().custom(objectId).required(),
    quantity: Joi.number().required(),
    fullname: Joi.string()

  }),
};

const removeItemAdmin = {
  // body: Joi.object().keys({
  body: Joi.object().keys({
    product: Joi.string().custom(objectId),
    _package: Joi.string().custom(objectId).required(),
    packageItemId: Joi.string().custom(objectId),
    userId: Joi.string().custom(objectId).required(),
  }).min(3).max(3),
  //   product: Joi.string().custom(objectId).required(),
  //   _package: Joi.string().custom(objectId).required(),

  //   packageItemId: Joi.string().custom(objectId),
  // }).min(3).max(3),
};

const emptyCartAdmin = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
};

const getCartAdmin = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
};

const updatePaymentMethod = {
  body: Joi.object().keys({
    wallet: Joi.boolean().required(),
    pin: Joi.string().min(4).max(4)
  })
}

const adminUpdatePaymentMethod = {
  body: Joi.object().keys({
    wallet: Joi.boolean().required(),
    userId: Joi.string().custom(objectId).required(),
  })
}

const adminPartialPayment = {
  body: Joi.object().keys({
    wallet: Joi.boolean().required(),
    userId: Joi.string().custom(objectId).required(),
    amount: Joi.number().required(),
  })
}


module.exports = {
  addToCart,
  removePackageFromCart,
  removeItemFromCart,
  unloadPackageFromCart,
  deletePackageFromCart,
  adminCart,
  removeItemAdmin,
  emptyCartAdmin,
  getCartAdmin,
  updatePaymentMethod,
  adminUpdatePaymentMethod,
  adminPartialPayment
  // getUsers,
  // getUser,
  // updateUser,
  // deleteUser,
};

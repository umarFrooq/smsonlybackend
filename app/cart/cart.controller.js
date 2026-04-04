/**
 * Vintega Solutions
 *
 * Cart Controller, it encapsulates all cart related methods.
 * These methods are called via API endpoints. Endpoints require user level authorization.
 *
 * @summary Cart Controller, called via API endpoints
 * @author Muhammad Mustafa
 *
 * Created at     : 2020-08-03 13:52:11
 * Last modified  : 2020-11-03 14:01:18
 */

/**
 * @function getUsers //called via API endpoint
 *
 * @param {*} req // Query and body parameters
 * @param {*} res // API Response
 * @param {*} next // not used at the moment
 * @returns API Response
 */
//TODO: Document all methods and correct response messages accordingly

const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const cartService = require("./cart.service");

const addItemToCart = catchAsync(async (req, res) => {
  Object.assign(req.body, { multiLangVar: res.__("CART_MODULE.YOU_CAN_ONLY_BUY"), multiLangVar1: res.__("CART_MODULE.ITEMY") })
  const cart = await cartService.addItemToCartV2(req.user.id, req.body, req.user);
  // res.status(httpStatus.CREATED).send(cart);
  res.sendStatus(cart);
});

const addPackageToCart = catchAsync(async (req, res) => {
  const cart = await cartService.addPackageToCart(req.user.id, req.body);
  // res.status(httpStatus.CREATED).send(cart);
  res.sendStatus(cart);
});

const removeItemFromCart = catchAsync(async (req, res) => {
  const cart = await cartService.removeItemFromCart(req.user.id, req.body);
  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
});
const removePackageFromCart = catchAsync(async (req, res) => {
  const cart = await cartService.deletePackageFromCart(req.user.id, req.body);
  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
});
const unloadPackageFromCart = catchAsync(async (req, res) => {
  const cart = await cartService.unloadPackageFromCart(req.user.id, req.body);
  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
});
// const deletePackageFromCart = catchAsync(async (req, res) => {
//   const cart = await cartService.deletePackageFromCart(req.user.id,req.body);
//   res.status(httpStatus.OK).send(cart);
// });

const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCartByUser(req.user.id,true,true);

  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
});
const emptyCart = catchAsync(async (req, res) => {
  const cart = await cartService.emptyCart(req.user.id);

  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
});

const adminCart = catchAsync(async (req, res) => {
  const cart = await cartService.adminCart(req.body, req.user);
  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
});

const removeItemAdmin = catchAsync(async (req, res) => {
  const cart = await cartService.removeItemAdmin(req.body);
  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
});

const emptyCartAdmin = catchAsync(async (req, res) => {
  const cart = await cartService.emptyCartAdmin(req.params.userId);
  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
});


const getCartAdmin = catchAsync(async (req, res) => {
  const cart = await cartService.getCartAdmin(req.params.userId);

  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
});

const updatePaymentMethod = catchAsync(async (req, res) => {
  const cart = await cartService.updatePaymentMethod(req.user, req.body);
  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
})

const getCartCount = catchAsync(async (req, res) => {
  const cart = await cartService.getCartCount(req.user.id);
  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart.data, cart.status, cart.message);
})

const adminPartialPayment = catchAsync(async (req, res) => {
  const cart = await cartService.adminPartialPayment(req.user, req.body);
  // res.status(httpStatus.OK).send(cart);
  res.sendStatus(cart);
})

const generatePVId = catchAsync(async (req, res) => {
  const result = await cartService.generatePVId(req.user.id);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result.data, result.status, result.message);
})

module.exports = {
  addPackageToCart,
  removePackageFromCart,
  addItemToCart,
  removeItemFromCart,
  getCart,
  unloadPackageFromCart,
  // deletePackageFromCart,

  emptyCart,
  adminCart,
  removeItemAdmin,
  emptyCartAdmin,
  getCartAdmin,
  updatePaymentMethod,
  getCartCount,
  adminPartialPayment,
  generatePVId
  // getUsers,
  // getUser,
  // updateUser,
  // deleteUser,
};

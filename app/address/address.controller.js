/**
 * Vintega Solutions
 *
 * address Controller, it encapsulates all cart related methods.
 * These methods are called via API endpoints. Endpoints require user level authorization.
 *
 * @summary address Controller, called via API endpoints
 * @author Muhammad Mustafa
 *
 * Created at     : 2020-08-03 13:52:11
 * Last modified  : 2020-11-03 14:01:18
 */

/**
 * @function getAllAddresses //called via API endpoint
 *
 * @param {*} req // Query and body parameters
 * @param {*} res // API Response
 * @param {*} next // not used at the moment
 * @returns API Response
 */
//TODO: Document all methods and correct response messages accordingly

const httpStatus = require("http-status");
const { Address } = require("../../config/mongoose");
const catchAsync = require("../../utils/catchAsync");
const addressService = require("./address.service");
const { NO_CONTENT } = require("@/node_modules/http-status/lib/index");

const createAddress = catchAsync(async (req, res) => {
  const address = await addressService.createAddress(req.user.id, req.body);

  // res.status(httpStatus.CREATED).send(address);
  res.sendStatus(address)
});

const getAllAddresses = catchAsync(async (req, res) => {
  const result = await addressService.getAllAddresses(req.user.id);
  // res.send(result);
  res.sendStatus(result)
});
const updateAddress = catchAsync(async (req, res) => {
  const address = await addressService.updateAddress(
    req.params.addressId,
    req.user.id,
    req.body
  );

  // res.send(address);
  res.sendStatus(address)
});
const deleteAddress = catchAsync(async (req, res) => {
  await addressService.deleteAddress(req.params.addressId, req.user.id);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus()
});

const getUserAddresses = catchAsync(async (req, res) => {
  const addresses = await addressService.getUserAddresses(req.params.phone);
  // res.status(httpStatus.OK).send(addresses);
  res.sendStatus(addresses.data,addresses.status,addresses.message)
});

const createAsAdmin = catchAsync(async (req, res) => {
  const addresses = await addressService.createAsAdmin(
    req.params.phone,
    req.body
  );
  // res.status(httpStatus.OK).send(addresses);
  res.sendStatus(addresses.data,addresses.status,addresses.message)
});
const updateAsAdmin = catchAsync(async (req, res) => {
  const address = await addressService.updateAsAdmin(
    req.params.phone,
    req.body
  );

  // res.send(address);
  res.sendStatus(address)
});
module.exports = {
  createAddress,
  getAllAddresses,
  updateAddress,
  deleteAddress,
  getUserAddresses,
  createAsAdmin,
  updateAsAdmin,
};

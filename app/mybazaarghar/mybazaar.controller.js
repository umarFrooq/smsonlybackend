/**
 * Vintega Solutions
 *
 * WPS Controller, it encapsulates all wps related methods.
 * These methods are called via API endpoints. Endpoints require admin level authorization.
 * 
 * @summary Wordpress api controller, called via API endpoints
 *
 * Created at     : 2022-07-21 
 */


/**
 * @function createData //called via API endpoint
 *
 * @param {*} req // Query and body parameters
 * @param {*} res // API Response
 * @param {*} next // not used at the moment
 * @returns API Response
 */


const catchAsync = require("@/utils/catchAsync");
const wpService = require("./mybazaar.service");

const createData = catchAsync(async (req, res) => {
  const result = await wpService.createData(req.data);
  res.status(200).send(result);
});

module.exports = {
  createData
}
/**
 * @function Stiemap //called via API endpoint
 *
 * @param {*} req // Query and body parameters
 * @param {*} res // API Response
 * @param {*} next // not used at the moment
 * @returns API Response
 */
const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { creationOfSiteMaps } = require('./sitemap.utils');

const generateSiteMap = catchAsync(async (req, res) => {

  const sitemap = await creationOfSiteMaps(req.user);

  // res.status(httpStatus.OK).send(sitemap);
  res.sendStatus(sitemap.data,sitemap.status,sitemap.message);
});

module.exports = { generateSiteMap }
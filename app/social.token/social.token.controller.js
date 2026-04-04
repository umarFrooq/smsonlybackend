
const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const tokenService = require("./social.token.service")

const fbRefreshToken = catchAsync(async (req, res) => {
  const result = await tokenService.fbRefreshToken(req.body);
  res.sendStatus(result);
})

const getFbBussinesId = catchAsync(async (req, res) => {
  const result = await tokenService.getFbBussinesId(req.query.fbToken);
  res.sendStatus(result);
})



const getUserPageList = catchAsync(async (req, res) => {
  const query = pick(req.query, ["fbToken", "userId"])
  const result = await tokenService.getUserPageList(query, req.user);
  res.sendStatus(result);
})
module.exports = {

  fbRefreshToken,
  getFbBussinesId,
  getUserPageList

}
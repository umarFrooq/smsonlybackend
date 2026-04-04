const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const ipnService = require("./alfaIPN.service");

const callBackIpn = catchAsync(async (req, res) => {
    const result = await ipnService.callBackIpn(req.user, req.body, req.user.role);
    res.status(httpStatus.OK).send(result);
  });

const listenerIpn = catchAsync(async (req, res) => {
    const result = await ipnService.listenerIpn(req);
    res.status(httpStatus.OK).send(result);
  }
)
  

  module.exports = {
    callBackIpn,
    listenerIpn
  }
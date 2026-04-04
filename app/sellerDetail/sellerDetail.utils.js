const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const config = require("../../config/config");
const https = require("https");
const instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
})


const storeUtil = async (_payLoad, _options) => {
  let config = {
    method: _options.method,
    headers: { "Content-Type": "application/json" },
    url: _options.url,
    data: _payLoad,
  };
  return instance(config)
    .then((result) => {
      if (result.data && Object.keys(result.data).length)
          return result.data;
      else return null;
    })
    .catch((err) => {
      throw new ApiError(httpStatus.BAD_REQUEST, err);
    });
};

module.exports = {
    storeUtil
}
const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const config = require("../../../config/config");
const https = require("https");
const en=require('../../../config/locales/en')
const instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
})


const tcsUtil = async (_payLoad, _options) => {
  let config = {
    method: _options.method,
    headers: { "Content-Type": "application/json" },
    url: _options.url,
    data: _payLoad,
  };
  const credentials = getCredentials();
  config.headers["X-IBM-Client-Id"] = credentials.clientId;
  return instance(config)
    .then((result) => {
      if (result.data && result.data.returnStatus && result.data.returnStatus.status && result.data.returnStatus.status !== "SUCCESS" || result.data.status && result.data.status != "200")
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          result.data && result.data.returnStatus && result.data.returnStatus.message || 'ERROR_OCCURED'
        );
      else return result.data;
    })
    .catch((err) => {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err);
    });
};
const getCredentials = () => {
  let credentials = config.tcs;
  return credentials;
  
};

module.exports = { tcsUtil };

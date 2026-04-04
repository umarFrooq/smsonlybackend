const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const config = require("../../../config/config");
const https = require("https");
// const en=require('../../../config/locales/en')
const instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
})


const shypUtil = async (_payLoad, _options) => {
    const credentials = getCredentials();
    _payLoad["client_info"] = { ...credentials };
    let config = {
      method: _options.method,
      headers: { "Content-Type": "application/json" },
      url: _options.url,
      data: _payLoad,
    };

  return instance(config)
    .then((result) => {
      if (!result) {
        console.log("shyp util error", result);
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          result.data && result.data.returnStatus && result.data.returnStatus.message || 'ERROR_OCCURED'
        );
      }
      else return result.data;
    })
    .catch((err) => {
      console.log("shyp util error catch",err)
      throw new ApiError(httpStatus.BAD_REQUEST, err?.response?.data?.message || err);
    });
};
const getCredentials = () => {
  let credentials = config.shyp;
  return credentials;
  
};

module.exports = { shypUtil };

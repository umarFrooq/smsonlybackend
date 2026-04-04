const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const config = require("../../../config/config");
const https = require("https");
const instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
})


const utils = async (_payLoad, _options) => {
  let config = {
    method: _options.method,
    headers: { "Content-Type": "application/json" },
    url: _options.url,
    data: _payLoad,
  };
  return instance(config)
    .then((result) => {
      if (result.data && result.data.status == "1" && result.data.error == "0"){
          return result.data;
      }
      else{
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          result.data && result.data.error || 'ERROR_OCCURED'
        );
      }
    })
    .catch((err) => {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err);
    });
};

module.exports = { utils };

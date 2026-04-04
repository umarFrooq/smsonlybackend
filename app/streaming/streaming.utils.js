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


const streamingUtils = async (_payLoad, _options) => {
  let config = {
    method: _options.method,
    headers: { "Content-Type": "application/json" },
    url: _options.url,
    data: _payLoad,
  };

  if(_options.headers){
    config.headers = {...config.headers, ..._options.headers}
  }
  // console.log(headers)
  return instance(config)
    .then((result) => {

      return { data: result.data, isSuccess: true, message: "OK", status: 200 };

    })
    .catch((err) => {
      return { isSuccess: false, data: null, message: err.message, statu: 400 }
    });
};

module.exports = {
  streamingUtils
}
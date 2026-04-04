const axios = require("axios");
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const routeeCredentails = require("../../config/config");
const qs = require("querystring");
let routeeEnums = require("./routee.enums");
const db = require("../../config/mongoose");
const userService = require("../user/user.service");
const crypto = require("crypto");
const moment = require("moment");
const tokenServices = require("./token.service");
const config = require("../../config/config");
const { tokenTypes } = require("../../config/token");
const { routee } = require("../../config/config");
const User = db.User;
const en=require('../../config/locales/en')
const routeeUtils = async (data, _option) => {

  let options;
  if (_option.processData) {
    options = {
      method: _option.method,
      async: true,
      crossDomain: true,
      url: _option.url,
      headers: {
        Authorization: _option.authentication
          ? `Basic ${_option.token}`
          : `Bearer ${_option.token}`,
        // "authorization": `Basic ${_option.token}`,
        "Content-type": _option.contentType,
      },
      processData: false,
      data: data,
    };
  } else {
    options = {
      method: _option.method,
      async: true,
      crossDomain: true,
      url: _option.url,
      headers: {
        Authorization: _option.authentication
          ? `Basic ${_option.token}`
          : `Bearer ${_option.token}`,
        // "authorization": `Basic ${_option.token}`,
        "Content-type": _option.contentType,
      },
      data: data,
    };
  }
  return axios(options)
    .then((result) => {
      return result.data;
    })
    .catch((err) => {
      let errorMessage = ""
      if (err.response && err.response.data && err.response.data.developerMessage)
        errorMessage = err.response.data.developerMessage;
      else
        errorMessage = err.response.data;

      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        errorMessage
      );
    });
};

const routeeUtil = async (data, _option) => {

  let options;
  if (_option.processData) {
    options = {
      method: _option.method,
      async: true,
      crossDomain: true,
      url: _option.url,
      headers: {
        Authorization: _option.authentication
          ? `Basic ${_option.token}`
          : `Bearer ${_option.token}`,
        // "authorization": `Basic ${_option.token}`,
        "Content-type": _option.contentType,
      },
      processData: false,
      data: data,
    };
  } else {
    options = {
      method: _option.method,
      async: true,
      crossDomain: true,
      url: _option.url,
      headers: {
        Authorization: _option.authentication
          ? `Basic ${_option.token}`
          : `Bearer ${_option.token}`,
        // "authorization": `Basic ${_option.token}`,
        "Content-type": _option.contentType,
      },
      data: data,
    };
  }
  return axios(options)
    .then((result) => {
      return { data: result.data, isError: false, message:'SUCCESS'};
    })
    .catch((err) => {
      let errorMessage = ""
      if (err.response && err.response.data && err.response.data.developerMessage)
        errorMessage = err.response.data.developerMessage;
      else
        errorMessage = err.response.data;

      return ({ isError: true, message: errorMessage, data: {} })
    });
};
const phoneNumberVerificationRoutee = async (token, phoneNumber) => {
  if (!token && !token.length) token = await routeeTokenGeneration();
  if (token && phoneNumber) {
    let data = routeeEnums.phoneNumberValidationPayload;
    data.to = phoneNumber;
    let _options = routeeEnums.routeeRequestPayload;
    _options.url = "https://connect.routee.net/numbervalidator";
    _options.authentication = false;
    _options.method = "POST";
    _options.token = token;
    _options.contentType = "application/json";
    let phoneVerify = await routeeUtils(data, _options);
    {
      if (phoneVerify && phoneVerify.valid) return phoneVerify.valid;
      else throw new ApiError(httpStatus.NOT_FOUND, 'SMS_MODULE.INVALID_PHONE_NUMBER');
    }
  } else
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
     'SMS_MODULE.TOKEN_OR_PHONE_NUMBER_MISSING'
    );
};

const sendVerficationCode = async (token, phoneNumber) => {
  if (!token) token = await routeeTokenGeneration();
  if (phoneNumber && token) {
    let data = routeeEnums.verificationCodePayload;
    data.recipient = phoneNumber;
    let _options = routeeEnums.routeeRequestPayload;
    _options.url = "https://connect.routee.net/2step";
    _options.method = "POST";
    _options.authentication = false;
    _options.token = token;
    _options.contentType = "application/json";
    _options.processData = true;
    return await routeeUtils(data, _options);
  } else {
    throw new ApiError(httpStatus.NOT_FOUND,  'SMS_MODULE.TOKEN_OR_PHONE_NUMBER_MISSING');
  }
};

const codeVerfication = async (_code, _trackingId) => {
  const _routeeCredentials = `${routeeCredentails.routee.applicationId}:${routeeCredentails.routee.secretKey}`;
  const tokenCreate = Buffer.from(_routeeCredentials).toString("base64");
  let _options = routeeEnums.routeeRequestPayload;
  _options.method = "POST";
  _options.url = "https://auth.routee.net/oauth/token";
  _options.authentication = true;
  _options.token = tokenCreate;
  _options.contentType = "application/x-www-form-urlencoded";
  let data = { grant_type: "client_credentials" };
  data = qs.stringify(data);
  let token = await routeeUtils(data, _options);
  if (token && token.access_token) {
    let _options = routeeEnums.routeeRequestPayload;
    _options.method = "POST";
    _options.url = `https://connect.routee.net/2step/${_trackingId}`;
    _options.authentication = false;
    _options.token = token.access_token;
    _options.contentType = "application/x-www-form-urlencoded";
    let data = { answer: parseInt(_code, 10) };
    data = qs.stringify(data);
    return await routeeUtils(data, _options);
  }
};

const routeeValidation = async (phoneNumber) => {
  const _routeeCredentials = `${routeeCredentails.routee.applicationId}:${routeeCredentails.routee.secretKey}`;
  const tokenCreate = Buffer.from(_routeeCredentials).toString("base64");
  let _options = routeeEnums.routeeRequestPayload;
  _options.method = "POST";
  _options.url = "https://auth.routee.net/oauth/token";
  _options.authentication = true;
  _options.token = tokenCreate;
  _options.contentType = "application/x-www-form-urlencoded";
  let data = { grant_type: "client_credentials" };
  data = qs.stringify(data);
  let token = await routeeUtils(data, _options);
  if (token && token.access_token) {
    return await phoneNumberVerificationRoutee(token.access_token, phoneNumber);
  }
};
const routeeTokenGeneration = async () => {
  const _routeeCredentials = `${routeeCredentails.routee.applicationId}:${routeeCredentails.routee.secretKey}`;
  const tokenCreate = Buffer.from(_routeeCredentials).toString("base64");
  let _options = routeeEnums.routeeRequestPayload;
  _options.method = "POST";
  _options.url = "https://auth.routee.net/oauth/token";
  _options.authentication = true;
  _options.token = tokenCreate;
  _options.contentType = "application/x-www-form-urlencoded";
  let data = { grant_type: "client_credentials" };
  data = qs.stringify(data);
  let token = await routeeUtils(data, _options);
  if (token && token.access_token) {
    return token.access_token;
  } else throw new ApiError(httpStatus.NOT_FOUND, 'TOKEN_NOT_FOUND');
};

const phoneNumberValidation = async (phoneNumber) => {
  let verify = await phoneNumberVerificationRoutee("", phoneNumber);
  if (verify) {
    const user = await userService.getUserByPhoneNumber(phoneNumber);
    if (!user) {
      var fullname = "user_" + crypto.randomBytes(5).toString("hex");
      var tempUser = new User({
        phone: phoneNumber,
        fullname,
        verificationMethod: "sms",
      });
      const newUser = await userService.createUserWithPhone(tempUser);

      const expires = moment().add(
        config.jwt.registerOrLoginFromEmailTokenExpirationMinutes,
        "minutes"
      );
      const registerOrLoginToken = tokenServices.generateToken(
        newUser._id,
        expires
      );
      await tokenServices.saveToken(
        registerOrLoginToken,
        newUser._id,
        expires,
        tokenTypes.Register_Or_Login
      );
      return registerOrLoginToken;
    }
    const expires = moment().add(
      config.jwt.verificationPhoneExpirationMinutes,
      "minutes"
    );
    const registerOrLoginToken = tokenServices.generateToken(user.id, expires);
    await tokenServices.saveToken(
      registerOrLoginToken,
      user.id,
      expires,
      tokenTypes.Register_Or_Login
    );
    return registerOrLoginToken;
  }
};

const orderSms = async (sms, phoneNumber) => {
  const token = await routeeTokenGeneration();
  if (token && phoneNumber) {
    let data = { body: sms, to: phoneNumber, from: routee.sender }

    let _options = routeeEnums.routeeRequestPayload;
    _options.url = "https://connect.routee.net/sms";
    _options.method = "POST";
    _options.authentication = false;
    _options.token = token;
    _options.contentType = "application/json";
    await routeeUtil(data, _options);

  }
}
module.exports = {
  routeeUtils,
  routeeValidation,
  phoneNumberVerificationRoutee,
  sendVerficationCode,
  codeVerfication,
  routeeTokenGeneration,
  phoneNumberValidation,
  orderSms
};

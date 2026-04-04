const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const {responseMessages} = require('../config/locales/en');
const  i18n  = require('i18n')
// const loger = require('../middlewares/logger');

//TODO: Document errorConverter
const errorConverter = async(err, req, res, next) => {
  let error = err;
  if(error&&error.message){
   await multilingualErrorConerter(error, res)
    }
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || error.userMessage || httpStatus[statusCode];
    error = new ApiError(statusCode, message,null, false, err.stack);
  }
  // loger(req, res, null, error);
  next(error);
};

// eslint-disable-next-line no-unused-vars
//TODO: Document errorHandler
const errorHandler = (err, req, res, next) => {
  let { statusCode, message, userMessage, data} = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = err.message;
    userMessage = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    data:data,
    message,
    userMessage,
    ...(config.env === 'development' && { stack: err.stack }),
    
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

const multllingualError = (error)=>{
  try{
  return error.message
    .split(".")
    .reduce((prev, curr) => 
      prev[curr]
    , responseMessages);
  }catch(err){
    return false;
  }
}


const multilingualErrorConerter = async (error, res) => {
  let msg = error.message
  let predefinedError = multllingualError(error);
  if(predefinedError){
    error.message = predefinedError
    error.userMessage = res.__("responseMessages."+ msg)
  }
  else{
    // let translatedMessage = await translateString(res.locale, msg)
    let translatedMessage=null
    error.userMessage = translatedMessage && translatedMessage.isSuccess &&  translatedMessage.data || error.message
  }
}

module.exports = {
  errorConverter,
  errorHandler,
  multllingualError
};

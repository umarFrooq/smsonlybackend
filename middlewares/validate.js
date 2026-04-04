const Joi = require("joi");
const httpStatus = require('http-status');
const ApiError = require("../utils/ApiError");
const pick = require("../utils/pick");
const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ["params", "query", "body", "files"]); const object = pick(req, Object.keys(validSchema)); 
  // Allow unknown keys (e.g., additional query helpers) so that rolling deployments
  // or slight schema drift doesn't break clients immediately. Individual route
  // schemas should still explicitly define accepted params where strictness is required.
  const { value, error } = Joi.compile(validSchema).prefs({ errors: { label: "key" }, allowUnknown: true }).validate(object);
  if (error) {
    const errorMessage = error.details
      .map((details) => {
        if(details && details.message && details.message.includes('ref:')){
           details.message= details.message.replace('"',"").replace("ref:",'')
           return details.message
        }else{
          //details.message?details.message.replace(/\\$/,''):''
          
          if(details.message.includes=='"'){
            return  details.message.replaceAll('"',"")
          }else{
            return  details.message
          }
          
        }
        })
      .join(", ");

    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  } 
  Object.assign(req, value); return next();
};

module.exports = validate;

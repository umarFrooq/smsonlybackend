'use strict'
const en=require('../locales/en')
const joi = require('joi')

const envVarsSchema = joi.object({
  PORT: joi.number()
    .required()
}).unknown()
  .required()

const { error, value: envVars } = joi.validate(process.env, envVarsSchema)
if (error) {
  throw new Error(en.responseMessages.CONFIG_VALIDATION_ERROR +  `${error.message}`)
}

const config = {
  server: {
    port: envVars.PORT
  }
}
console.log("   fff",en.responseMessages.CONFIG_VALIDATION_ERROR)
module.exports = config

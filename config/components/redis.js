'use strict'
const en=require('../locales/en')
const joi = require('joi')

const envVarsSchema = joi.object({
  REDIS_URI: joi.string()
    .uri({ scheme: 'redis' })
    .required(),
  REDIS_DATA_RETENTION_IN_MS: joi.number()
    .default(86400000)
}).unknown()
  .required()

const { error, value: envVars } = joi.validate(process.env, envVarsSchema)
if (error) {
  throw new Error(en.responseMessages.CONFIG_VALIDATION_ERROR +` ${error.message}`)
}

const config = {
  redis: {
    uri: envVars.REDIS_URI,
    dataRetention: envVars.REDIS_DATA_RETENTION_IN_MS
  }
}

module.exports = config

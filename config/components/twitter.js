'use strict'
const en=require('../config/locales/en.json')
const joi = require('joi')

const envVarsSchema = joi.object({
  TWITTER_CONSUMER_KEY: joi.string().required(),
  TWITTER_CONSUMER_SECRET: joi.string().required(),
  TWITTER_ACCESS_TOKEN_KEY: joi.string().required(),
  TWITTER_ACCESS_TOKEN_SECRET: joi.string().required(),
  TWITTER_TRACK: joi.string().required()
}).unknown()
  .required()

const { error, value: envVars } = joi.validate(process.env, envVarsSchema)
if (error) {
  throw new Error( en.responseMessages.CONFIG_VALIDATION_ERROR +` ${error.message}`) 
}

const config = {
  twitter: {
    consumerKey: envVars.TWITTER_CONSUMER_KEY,
    consumerSecret: envVars.TWITTER_CONSUMER_SECRET,
    accessTokenKey: envVars.TWITTER_ACCESS_TOKEN_KEY,
    accessTokenSecret: envVars.TWITTER_ACCESS_TOKEN_SECRET,
    track: envVars.TWITTER_TRACK
  }
}

module.exports = config

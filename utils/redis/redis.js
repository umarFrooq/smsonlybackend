'use strict'

const Redis = require('ioredis')
const config = require('../../config/config')

const redis = new Redis(config.redis.options)

// if (redis.json) {
//     console.log('RedisJSON is available');
//   } else {
//     console.log('RedisJSON is not available');
//   }
module.exports = redis

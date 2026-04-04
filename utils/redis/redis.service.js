// const redis = require('./index');
// const { redisEnums } = require('../../config/enums');
// // const { find, findOne, findById }  = require('./redis');

// function Redis(id, payload, key, update=false, isDelete=false ) {
//     this.id = id;
//     this.update = update;
//     this.payload = payload;
//     this.isDelete = isDelete;
//     this.key = key;
// }

// Redis.prototype.cache = function () {
//     const key = `${redisEnums.KEYS.PRODUCTS}`;
//     if(id){
//         key += `-${this.id}`;
//     }
//     if (this.isDelete) {
//         redis.del(key)
//         return
//     }
//     if (this.update && this.payload) {
//         redis.set(key, JSON.stringify(this.payload), 'EX', redisEnums.TTL.PRODUCTS)
//         return this.payload
//     }
//     const data = redis.get(key);
//     if (data) {
//         return JSON.parse(data)
//     } else {
//         return void 0;
//     }
// }

// Redis

// module.exports = Redis;

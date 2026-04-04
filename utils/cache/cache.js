const redis = require("../redis/redis");
const { redisEnums } = require("../../config/enums");
let config = require("../../config/config");

let getKey = (key, id) => {
  let _key = "";
  if (key) _key += `${config.env}/${config.region}${key}`;
  if (id) _key += `-${id}`;
  return _key;
}


//we follow Facade articheture:-  a deceptive outward appearance.
// const  getAllCache = async (key, data, ttl=redisEnums.TTL.HOUR)=>{
//   let arr = [];
//   await redis.connect(); // connect redis
//    if (data && data.length > 0) {
//     let result = await redis.get(key);
//     arr = JSON.parse(result);
//       //check category exist in cache or not
//     if (arr.length > 0) {
//       //update delete and set in cache
//        const setCacheData=await setCache(key,data,ttl)
//         return setCacheData //return cache data

//     } else {
//       //set Categories
//       const setCacheData=await setCache(key,data,ttl)
//        arr = setCacheData; //return cache data
//     }

//     return arr;

// }
// }
//we follow Facade articheture:-  a deceptive outward appearance.
const getCache = async (key, id = undefined) => {
  let _key = getKey(key, id);
  // let result = await redis.get(_key);
  let result = await redis.get(_key);
  let cacheResult = result && result.length ? JSON.parse(result) : false;
  return cacheResult;
}

const setCache = async (key, id = undefined, data, ttl = redisEnums.TTL.HOUR) => {
  if (key) {
    let _key = getKey(key, id);
    redis.set(_key, JSON.stringify(data), "EX", ttl);
    return data;
  } else {
    return false;
  }
};

const deleteCasheByKey = async (key) => {
  if (key) {
    let _key = getKey(key);
    redis.del(_key, (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log("key deleted from cache");
      }
    });
  };
}

module.exports = { setCache, getCache, deleteCasheByKey };
const config = require("../../config/config");
const { categoryEnums } = require("../../config/enums");
let key
let time;
key =  `${categoryEnums.KEYS.CATEGORIES}_${config.env}`;
time = categoryEnums.TTL.DAY

module.exports = {key,time}
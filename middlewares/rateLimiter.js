const { ipWhitlist } = require('@/enums/enum');
const rateLimit = require('express-rate-limit');
const requestIp = require('request-ip');
const authLimiter = (req, res, next) => {
  // getting user ip
  const ip = requestIp.getClientIp(req);
  // ip whitelist check 
  if (ipWhitlist.includes(ip)) {
    next();
  } else {
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      skipSuccessfulRequests: true,
      message: "Too many requests from the same IP"
    });
    next();
  }
}
module.exports = {
  authLimiter
};

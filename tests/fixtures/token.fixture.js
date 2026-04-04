const moment = require('moment');
const config = require('../../config/config');
const tokenService = require('../../app/auth/token.service');
const { studentOne, admin, superadmin } = require('./user.fixture');

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
const studentOneAccessToken = tokenService.generateToken(studentOne._id, accessTokenExpires);
const adminAccessToken = tokenService.generateToken(admin._id, accessTokenExpires);
const superadminAccessToken = tokenService.generateToken(superadmin._id, accessTokenExpires);


module.exports = {
  studentOneAccessToken,
  adminAccessToken,
  superadminAccessToken,
};

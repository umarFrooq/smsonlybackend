
/**
 * This document holds all the enum values used in code level.
 * Any hard coded value is discouraged
 * @summary Enum used in code level.
 * @author Muhammad Mustafa
 *
 * Created at     : 2020-08-03 13:29:05 
 * Last modified  : 2020-08-03 13:31:40
 */

const paymentStatus = ["pending", "paid"];
const loginOptions = ["local", "google", "facebook"];
const roles = Object.freeze({
  user: "user",
  admin: "admin",
});
const loginMethods = Object.freeze({
  local: "local",
  facebook: "facebook",
  google: "google",
});

const ipWhitlist = []  //["119.158.120.246", "58.65.160.60"]
module.exports = {
  paymentStatus,
  loginMethods,
  loginOptions,
  roles,
  ipWhitlist
};

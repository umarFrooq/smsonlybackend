const mongoose = require('mongoose');
const faker = require('faker');
const db = require("../../config/mongoose");

const { userOne,userTwo } = require('./user.fixture');
const Address = db.Address;
const addressOne = {
  _id: mongoose.Types.ObjectId(),
  fullname: "fake fullname",
  phone: "+923010000000",
  province:'fake province',
  city: "fake city",
  city_code: "fake city_code",
  address:"fake address",
  addressType: "home",
  
  user: userOne._id,
};
const addressTwo = {
  _id: mongoose.Types.ObjectId(),
  fullname: "fake fullname 2",
  phone: "+923010000000",
  province:'fake province',
  city: "fake city",
  city_code: "fake city_code",
  address:"fake address",
  addressType: "home",
  
  user: userOne._id,
};
const addressThree = {
  _id: mongoose.Types.ObjectId(),
  fullname: "userTwo fullname ",
  phone: "+923010000000",
  province:'fake province',
  city: "fake city",
  city_code: "fake city_code",
  address:"fake address",
  addressType: "home",
  
  user: userTwo._id,
};
const addressFour = {
  _id: mongoose.Types.ObjectId(),
  fullname: "userTwo  fullname ",
  phone: "+923010000000",
  province:'fake province',
  city: "fake city",
  city_code: "fake city_code",
  address:"fake address",
  addressType: "home",
  
  user: userTwo._id,
};
const insertAddresses = async (addresses) => {
  await Address.insertMany(addresses);
};

module.exports = {
  addressOne,
  addressTwo,
  addressThree,
  addressFour,
  insertAddresses,
};

const mongoose = require('mongoose');

const db = require("../../config/mongoose");
const {
  productOne,
  productTwo,
  productThree,
  
} = require("./product.fixture");
const {
  userOne,
  userTwo,
  userThree,
  
} = require("./user.fixture");

const WishList = db.WishList;


const wishListOne = {
  _id: mongoose.Types.ObjectId(),
  products: [productOne._id.toHexString()],
  user:userOne._id
};
const wishListTwo = {
  _id: mongoose.Types.ObjectId(),
  products: [productTwo._id.toHexString()],
  user:userTwo._id
};
const wishListThree = {
  _id: mongoose.Types.ObjectId(),
  products: [productOne._id.toHexString(),productTwo._id.toHexString(),productThree._id.toHexString()],
  user:userThree._id
};



const insertWishLists = async (wishLists) => {
  await WishList.insertMany(wishLists);
};

module.exports = {
  wishListOne,
  wishListTwo,
  wishListThree,
  insertWishLists,
};

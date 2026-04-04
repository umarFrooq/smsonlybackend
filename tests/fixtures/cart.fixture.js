const mongoose = require('mongoose');

const db = require("../../config/mongoose");
const {
  productOne,
  productTwo,
  productThree,
  
} = require("../fixtures/product.fixture");
const {
  userOne,
  userTwo,
  userThree,
  
} = require("../fixtures/user.fixture");

const Cart = db.Cart;


const itemsOne = {
  _id: mongoose.Types.ObjectId(),
  product: productOne._id.toHexString(),
  quantity:2
};
const itemsTwo = {
  _id: mongoose.Types.ObjectId(),
  product: productTwo._id.toHexString(),
  quantity:2
};
const itemsThree = {
  _id: mongoose.Types.ObjectId(),
  product: productThree._id.toHexString(),
  quantity:2
};
const cartOne = {
  _id: mongoose.Types.ObjectId(),
  items: [itemsOne],
  user:userOne._id
};
const cartTwo = {
  _id: mongoose.Types.ObjectId(),
  items: [itemsOne,itemsTwo],
  user:userTwo._id
};
const cartThree = {
  _id: mongoose.Types.ObjectId(),
  items: [itemsOne,itemsTwo,itemsThree],
  user:userThree._id
};



const insertCarts = async (carts) => {
  await Cart.insertMany(carts);
};

module.exports = {
  cartOne,
  cartTwo,
  cartThree,
  insertCarts,
};

const mongoose = require('mongoose');
const faker = require('faker');
const db = require("../../config/mongoose");

const { supplierOne,supplierTwo } = require('../fixtures/user.fixture');
const Product = db.Product;
const productOne = {
  _id: mongoose.Types.ObjectId(),
  productName: faker.commerce.productName(),
  description: faker.commerce.productMaterial(),
  price: 50,
  salePrice:50,
  regularPrice:60,
  onSale: true,
  weight: 2.20,
  quantity: 40,
  active: true,
  isVariable: false,
  user: supplierOne._id,
};
const productOneOne = {
  _id: mongoose.Types.ObjectId(),
  productName: faker.commerce.productName(),
  description: faker.commerce.productMaterial(),
  price: 60,
  salePrice:50,
  regularPrice:60,
  onSale: false,
  weight: 2.20,
  quantity: 40,
  active: true,
  isVariable: false,
  user: supplierOne._id,
};
const productTwo = {
  _id: mongoose.Types.ObjectId(),
  productName: faker.commerce.productName(),
  description: faker.commerce.productMaterial(),
  regularPrice: 600,
  price: 500,
  salePrice:500,
  onSale: true,
  quantity: 20,
  weight: 2.20,
  active: false,
  isVariable: false,
  user:supplierTwo._id,
}
const productTwoTwo = {
  _id: mongoose.Types.ObjectId(),
  productName: faker.commerce.productName(),
  description: faker.commerce.productMaterial(),
  regularPrice: 700,
  price: 500,
  salePrice:500,
  onSale: true,
  quantity: 20,
  weight: 2.20,
  active: false,
  isVariable: false,
  user:supplierTwo._id,
}
const productThree = {
  _id: mongoose.Types.ObjectId(),
  productName: faker.commerce.productName(),
  description: faker.commerce.productMaterial(),
  regularPrice: 1200,
  salePrice:500,
  onSale: false,
  price: 1200,
  quantity: 20,
  weight: 2.20,
  active: true,
  isVariable: false,
  user:supplierTwo._id,
}
const productThreeThree = {
  _id: mongoose.Types.ObjectId(),
  productName: faker.commerce.productName(),
  description: faker.commerce.productMaterial(),
  regularPrice: 1200,
  salePrice:500,
  onSale: false,
  price: 1200,
  quantity: 20,
  weight: 2.20,
  active: true,
  isVariable: false,
  user:supplierTwo._id,
}

const insertProducts = async (products) => {
  await Product.insertMany(products);
};

module.exports = {
  productOne,
  productTwo,
  productThree,
  productTwoTwo,
  productOneOne,
  productThreeThree,
  insertProducts,
};

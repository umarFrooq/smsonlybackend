const mongoose = require('mongoose');
const db = require("../../config/mongoose");

const {adminTwo,admin } = require('./user.fixture');
const Category = db.Category;
const electronics = {
  _id: mongoose.Types.ObjectId(),
  name: "Electronics",
   commission: 15,
  description: "Generall category for all Electronics",

};
const computers = {
  _id: mongoose.Types.ObjectId(),
  name: "Computers",
  commission:10,
  description: "category for Computers",
}
const bags = {
  _id: mongoose.Types.ObjectId(),
  name: "Bags",
  commission:10,
  description: "category for Bags",
}
const mobiles = {
  _id: mongoose.Types.ObjectId(),
  name: "Mobiles",
  commission:10,
  description: "category for mobiles",
  hasChildren:true,
  
}
const mobilesAccessories = {
  _id: mongoose.Types.ObjectId(),
  name: "Mobile Accessories",
  commission:10,
  description: "category for mobile Accessories",
}
const androidMobile = {
  _id: mongoose.Types.ObjectId(),
  name: "Mobile Accessories",
  commission:10,
  description: "category for mobile Accessories",
  parent :mobiles._id,
}
const iosMobile = {
  _id: mongoose.Types.ObjectId(),
  name: "Mobile Accessories",
  commission:10,
  description: "category for mobile Accessories",
  parent :mobiles._id,
}

const insertCategories = async (categories) => {
  await Category.insertMany(categories);
};

module.exports = {
  electronics,
  computers,
  mobiles,
  bags,
  iosMobile,
  androidMobile,
  mobilesAccessories,
  insertCategories,
};

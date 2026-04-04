const mongoose = require('mongoose');
const db = require("../../config/mongoose");
const {productOne,productTwo,productThree } = require('./product.fixture');
const {userOne,userTwo } = require('./user.fixture');
const Review = db.Review;
const Review1 = {
  _id: mongoose.Types.ObjectId(),
  product:productOne._id,
  reviewer:userOne._id,
  
  comment: "perfect",
  rating: 5,
};
const Review2 = {
  _id: mongoose.Types.ObjectId(),
  product:productOne._id,
  reviewer:userTwo._id,
  
  comment: "excellent",
  rating: 5,
}
const Review3 = {
  _id: mongoose.Types.ObjectId(),
  product:productTwo._id,
  reviewer:userOne._id,
  
  comment: "excellent",
  rating: 5,
}
const Review4 = {
  _id: mongoose.Types.ObjectId(),
  product:productTwo._id,
  reviewer:userTwo._id,
  
  comment: "excellent",
  rating: 5,
}
const Review5 = {
  _id: mongoose.Types.ObjectId(),
  product:productThree._id,
  reviewer:userOne._id,
  
  comment: "nice  ",
  rating: 4,
}
const Review6 = {
  _id: mongoose.Types.ObjectId(),
  product:productThree._id,
  reviewer:userTwo._id,
  
  comment: "nice ",
  rating: 4,
}


const insertReviews = async (reviews) => {
  await Review.insertMany(reviews);
};

module.exports = {
  Review1,
  Review2,
  Review3,
  Review4,
  Review5,
  Review6,

  insertReviews,
};

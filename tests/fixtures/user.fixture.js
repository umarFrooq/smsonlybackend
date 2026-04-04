const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const faker = require('faker');

const db = require("../../config/mongoose");

const User = db.User;
const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

const { schoolOne } = require('./school.fixture');
const { branchOne } = require('./branch.fixture');

const studentOne = {
  _id: mongoose.Types.ObjectId(),
  fullname: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'student',
  schoolId: schoolOne._id,
  branchId: branchOne._id,
};

const studentTwo = {
  _id: mongoose.Types.ObjectId(),
  fullname: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'student',
  schoolId: schoolOne._id,
  branchId: branchOne._id,
};

const admin = {
  _id: mongoose.Types.ObjectId(),
  fullname: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'admin',
  schoolId: schoolOne._id,
  branchId: branchOne._id,
};

const superadmin = {
  _id: mongoose.Types.ObjectId(),
  fullname: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'superadmin',
  schoolId: schoolOne._id,
};


const insertUsers = async (users) => {
  await User.insertMany(users.map((user) => ({ ...user, password: hashedPassword })));
};

module.exports = {
  studentOne,
  studentTwo,
  admin,
  superadmin,
  insertUsers,
};

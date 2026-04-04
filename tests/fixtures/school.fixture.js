const mongoose = require('mongoose');
const faker = require('faker');
const School = require('../../app/school/school.model');

const schoolOne = {
  _id: mongoose.Types.ObjectId(),
  name: faker.company.companyName(),
  address: faker.address.streetAddress(),
};

const insertSchools = async (schools) => {
  await School.insertMany(schools);
};

module.exports = {
  schoolOne,
  insertSchools,
};

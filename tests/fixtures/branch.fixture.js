const mongoose = require('mongoose');
const faker = require('faker');
const Branch = require('../../app/branch/branch.model');
const { schoolOne } = require('./school.fixture');

const branchOne = {
  _id: mongoose.Types.ObjectId(),
  name: faker.company.companySuffix(),
  address: faker.address.streetAddress(),
  schoolId: schoolOne._id,
};

const insertBranches = async (branches) => {
  await Branch.insertMany(branches);
};

module.exports = {
  branchOne,
  insertBranches,
};

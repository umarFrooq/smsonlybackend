const mongoose = require('mongoose');
const config = require('../../config/config');


const setupTestDB = () => {
  beforeAll(async () => {
    await mongoose.connect(config.mongo.url, config.mongo.options);
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections)
    .map(async (collection) => collection.deleteMany()));
  });

  afterAll(async () => {
    // await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });
};

module.exports = setupTestDB;

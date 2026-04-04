const mongoose = require('mongoose');
const User = require('../app/user/user.model');
const config = require('../config/config');

const generateRegistrationNumber = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `USER-${dateString}-${randomNumber}`;
};

const run = async () => {
  try {
    await mongoose.connect(config.mongo.url, config.mongo.options);
    console.log('Connected to MongoDB');

    const users = await User.find({ registrationNumber: { $exists: false } });
    console.log(`Found ${users.length} users without a registration number.`);

    for (const user of users) {
      user.registrationNumber = generateRegistrationNumber();
      await user.save();
      console.log(`Updated user ${user.email} with registration number ${user.registrationNumber}`);
    }

    console.log('Finished updating users.');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

run();

const mongoose = require('mongoose');
const { connectDB, User, Branch, Grade } = require('../config/mongoose');

const inspectDatabase = async () => {
  try {
    await connectDB();

    console.log('Fetching all users...');
    const users = await User.find({}).lean();
    console.log('Users:', JSON.stringify(users, null, 2));

    console.log('Fetching all branches...');
    const branches = await Branch.find({}).lean();
    console.log('Branches:', JSON.stringify(branches, null, 2));

    console.log('Fetching all grades...');
    const grades = await Grade.find({}).lean();
    console.log('Grades:', JSON.stringify(grades, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error inspecting database:', error);
    process.exit(1);
  }
};

inspectDatabase();

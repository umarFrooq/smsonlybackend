const mongoose = require('mongoose');
const { connectDB, User, Branch, Grade } = require('../config/mongoose');

const debugAnalytics = async () => {
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

    console.log('Debugging branch name logic...');
    const branchMap = {};
    branches.forEach(b => {
      branchMap[b._id.toString()] = b.name || b.branchCode || 'Unknown Branch';
    });

    grades.forEach(grade => {
      const branchKey = grade.branchId?.toString();
      const branchName = branchMap[branchKey] || 'Unknown Branch';
      console.log(`Grade: ${grade.title}, Branch: ${branchName}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error debugging analytics:', error);
    process.exit(1);
  }
};

debugAnalytics();

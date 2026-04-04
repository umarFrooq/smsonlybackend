const db = require('../config/mongoose');
const mongoose = require('mongoose');

async function run() {
  try {
    await db.connectDB();
    const gradeId = '68acb6d03ec1b20640d20811';
    console.log('Checking users with gradeId =', gradeId);
    const usersWithGrade = await db.User.find({ gradeId: mongoose.Types.ObjectId(gradeId) }).select('fullname _id gradeId branchId monthlyFee');
    console.log('Found', usersWithGrade.length, 'users with gradeId');
    usersWithGrade.forEach(u => console.log(JSON.stringify(u.toObject(), null, 2)));

    console.log('\nChecking users where gradeId is missing but monthlyFee exists');
    const usersMonthlyNoGrade = await db.User.find({ $or: [{ gradeId: { $exists: false } }, { gradeId: null }], monthlyFee: { $exists: true, $ne: null } }).select('fullname _id gradeId branchId monthlyFee');
    console.log('Found', usersMonthlyNoGrade.length, 'users with monthlyFee but no gradeId');
    usersMonthlyNoGrade.forEach(u => console.log(JSON.stringify(u.toObject(), null, 2)));

    process.exit(0);
  } catch (err) {
    console.error('Error during check:', err);
    process.exit(1);
  }
}

run();

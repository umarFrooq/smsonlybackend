#!/usr/bin/env node
const mongoose = require('mongoose');

// adjust relative paths because this script lives in /scripts
const User = require('../app/user/user.model');
const SchoolBilling = require('../models/SchoolBilling');
const BillingTransaction = require('../models/BillingTransaction');

const email = process.argv[2] || 'umar@gmail.com';
const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/stmsbackend';

(async function main() {
  try {
    console.log('Connecting to', mongoUrl);
    await mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

    const user = await User.findOne({ email }).lean();
    if (!user) {
      console.error('User not found for email:', email);
      process.exit(2);
    }

    console.log('User:');
    console.log(JSON.stringify({ _id: user._id, email: user.email, schoolId: user.schoolId }, null, 2));

    const schoolId = user.schoolId;
    if (!schoolId) {
      console.error('User does not have a schoolId set.');
      process.exit(3);
    }

    const billing = await SchoolBilling.findOne({ schoolId }).lean();
    console.log('\nSchoolBilling:');
    console.log(billing ? JSON.stringify(billing, null, 2) : 'No SchoolBilling record found');

    const transactions = await BillingTransaction.find({ schoolId }).sort({ createdAt: -1 }).limit(20).lean();
    console.log('\nBillingTransactions (last 20):');
    if (transactions && transactions.length) console.log(JSON.stringify(transactions, null, 2)); else console.log('No transactions found');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error running checkBilling:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();

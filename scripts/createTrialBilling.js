require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../app/user/user.model');
const SchoolBilling = require('../models/SchoolBilling');

const schoolId = process.argv[2];
const days = parseInt(process.argv[3] || '30', 10);
if (!schoolId) {
  console.error('Usage: node scripts/createTrialBilling.js <schoolId> [days]');
  process.exit(2);
}

const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/stmsbackend';
(async function(){
  try{
    await mongoose.connect(mongoUrl, { useNewUrlParser:true, useUnifiedTopology:true });
    const studentCount = Math.max(1, await User.countDocuments({ schoolId, role: 'student' }));
    const nextBilling = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const update = { planKey: 'trial', status: 'trialing', studentCount, nextBillingDate: nextBilling, trialUsed: true };
    const billing = await SchoolBilling.findOneAndUpdate({ schoolId }, { $set: update }, { upsert: true, new: true });
    console.log('Created/Updated SchoolBilling:', JSON.stringify(billing, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  }catch(e){
    console.error('Error creating trial billing:', e);
    try{ await mongoose.disconnect(); }catch{};
    process.exit(1);
  }
})();

#!/usr/bin/env node
const mongoose = require('mongoose');
const User = require('../app/user/user.model');
const SchoolBilling = require('../models/SchoolBilling');
const BillingTransaction = require('../models/BillingTransaction');
const email = process.argv[2] || 'umar@gmail.com';
const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/stmsbackend';
(async function main(){
  try{
    await mongoose.connect(mongoUrl, { useNewUrlParser:true, useUnifiedTopology:true });
    const user = await User.findOne({ email }).lean();
    if(!user){ console.log('User not found for', email); process.exit(2); }
    console.log('User:', { _id: String(user._id), email: user.email, schoolId: String(user.schoolId) });
    const billing = await SchoolBilling.findOne({ schoolId: user.schoolId }).lean();
    if(!billing) console.log('SchoolBilling: NOT FOUND'); else console.log('SchoolBilling:', { planKey: billing.planKey, status: billing.status, studentCount: billing.studentCount, stripeSubscriptionId: billing.stripeSubscriptionId, nextBillingDate: billing.nextBillingDate });
    const txCount = await BillingTransaction.countDocuments({ schoolId: user.schoolId });
    console.log('BillingTransaction count:', txCount);
    const lastTx = await BillingTransaction.findOne({ schoolId: user.schoolId }).sort({ createdAt: -1 }).lean();
    if(lastTx) console.log('Last transaction:', { _id: String(lastTx._id), amount: lastTx.amount, currency: lastTx.currency, status: lastTx.status, invoiceId: lastTx.invoiceId, createdAt: lastTx.createdAt });
    await mongoose.disconnect(); process.exit(0);
  }catch(e){ console.error(e); try{ await mongoose.disconnect(); }catch{}; process.exit(1); }
})();

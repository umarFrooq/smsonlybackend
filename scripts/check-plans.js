const mongoose = require('mongoose');
require('dotenv').config();
const SubscriptionPlan = require('../models/SubscriptionPlan');

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/stmsbackend';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const plans = await SubscriptionPlan.find({}).lean();
  console.log('Found plans:', plans.length);
  plans.forEach(p => {
    console.log(`- key=${p.key}, name=${p.name}, price=${p.price}, priceId=${p.priceId}, active=${p.active}`);
  });
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });

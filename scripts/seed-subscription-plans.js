/**
 * Seed subscription plans: trial, premium, custom
 * Usage: node scripts/seed-subscription-plans.js
 * Ensure `MONGO_URI` is set or defaults to mongodb://localhost:27017/stmsbackend
 */
const mongoose = require('mongoose');
require('dotenv').config();

const SubscriptionPlan = require('../models/SubscriptionPlan');

// Prefer MONGO_URI, then MONGODB_URL (project uses this), then fallback to localhost
const MONGO = process.env.MONGO_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/stmsbackend';

async function seed() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

  const plans = [
    {
      key: 'trial',
      name: 'Trial',
      price: 0,
      currency: 'PKR',
      monthlyQuota: 1000,
      studentLimit: 100,
      perStudentCharge: 0,
      description: 'Free trial plan with limited quota',
      active: true,
    },
    {
      key: 'premium',
      name: 'Premium',
      price: 2000,
      // default to provided Stripe Price ID if env var not set
      priceId: process.env.STRIPE_PRICE_PREMIUM || 'price_1SjDBIJlnhWJXlMI3AN0wNIB',
      currency: 'PKR',
      monthlyQuota: 10000,
      studentLimit: 10000,
      perStudentCharge: 0,
      description: 'Fixed monthly premium plan',
      active: true,
    },
    {
      key: 'custom',
      name: 'Custom',
      price: 0,
      // default to provided Stripe Price ID if env var not set
      priceId: process.env.STRIPE_PRICE_CUSTOM || 'price_1SjDS0JlnhWJXlMIfYiHnmru',
      currency: 'PKR',
      monthlyQuota: 0,
      studentLimit: 0,
      perStudentCharge: 20,
      description: 'Charge per student (20 PKR per student per month) — use Stripe recurring price with unit_amount=20',
      active: true,
    },
  ];

  for (const p of plans) {
    await SubscriptionPlan.findOneAndUpdate({ key: p.key }, { $set: p }, { upsert: true });
    console.log('Upserted plan', p.key);
  }

  await mongoose.disconnect();
  console.log('Seeding complete');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

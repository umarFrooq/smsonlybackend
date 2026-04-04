#!/usr/bin/env node
const mongoose = require('mongoose');
const SchoolBilling = require('../models/SchoolBilling');
// Load .env when running scripts locally
require('dotenv').config();
const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY || '';

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/fixNextBillingDate.js <schoolId|subscriptionId>');
    process.exit(2);
  }

  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY not set in environment. Set it and retry.');
    process.exit(3);
  }

  const stripe = require('stripe')(stripeKey);
  const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/stmsbackend';

  try {
    await mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

    // Try to find billing by schoolId first
    let billing = null;
    const isLikelyObjectId = /^[0-9a-fA-F]{24}$/.test(arg);
    if (isLikelyObjectId) {
      billing = await SchoolBilling.findOne({ schoolId: arg }).lean();
    }

    // If not found, try by stripeSubscriptionId
    if (!billing) {
      billing = await SchoolBilling.findOne({ stripeSubscriptionId: arg }).lean();
    }

    if (!billing) {
      console.error('No SchoolBilling found for provided identifier:', arg);
      await mongoose.disconnect();
      process.exit(4);
    }

    const subscriptionId = billing.stripeSubscriptionId;
    if (!subscriptionId) {
      console.error('Billing found but no stripeSubscriptionId present on record:', billing);
      await mongoose.disconnect();
      process.exit(5);
    }

    console.log('Found billing for schoolId:', billing.schoolId, 'subscriptionId:', subscriptionId);

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    if (!sub) {
      console.error('Stripe subscription not found for id:', subscriptionId);
      await mongoose.disconnect();
      process.exit(6);
    }

    // Determine next billing date. Prefer `current_period_end`, else try `latest_invoice.period_end`,
    // else compute from `start_date` + plan interval.
    let periodEnd = sub.current_period_end;
    if (!periodEnd && sub.latest_invoice) {
      try {
        const invoice = await stripe.invoices.retrieve(sub.latest_invoice);
        periodEnd = invoice.period_end || invoice.lines?.data?.[0]?.period?.end;
      } catch (e) {
        console.warn('Failed to retrieve latest invoice for subscription:', e.message || e);
      }
    }

    if (!periodEnd && sub.start_date && sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].plan) {
      // Fallback: compute using plan interval
      const plan = sub.items.data[0].plan;
      const interval = plan.interval; // 'day' | 'month' | 'year'
      const count = plan.interval_count || 1;
      const start = sub.start_date;
      const secondsPer = interval === 'day' ? 86400 : (interval === 'month' ? 2629800 : (interval === 'year' ? 31557600 : 0));
      if (secondsPer) periodEnd = start + (secondsPer * count);
    }

    if (!periodEnd) {
      console.error('Unable to determine next billing period end for subscription:', subscriptionId);
      await mongoose.disconnect();
      process.exit(7);
    }

    const nextBillingDate = new Date(periodEnd * 1000);
    console.log('Updating nextBillingDate to', nextBillingDate.toISOString());

    const updated = await SchoolBilling.findOneAndUpdate({ schoolId: billing.schoolId }, { $set: { nextBillingDate } }, { new: true });

    console.log('Updated SchoolBilling:', updated);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error updating nextBillingDate:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

main();

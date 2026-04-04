/**
 * Monthly billing job: iterates SchoolBilling entries and charges per plan
 * Usage: node scripts/monthly-billing.js
 * Requires STRIPE_SECRET_KEY and MONGO_URI environment variables
 */
const mongoose = require('mongoose');
require('dotenv').config();

const SchoolBilling = require('../models/SchoolBilling');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const BillingTransaction = require('../models/BillingTransaction');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/stmsbackend';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

  const billings = await SchoolBilling.find({ status: { $ne: 'cancelled' } });
  for (const b of billings) {
    try {
      const plan = await SubscriptionPlan.findOne({ key: b.planKey });
      if (!plan) continue;

      let amountPKR = 0;
      if (b.planKey === 'custom') {
        amountPKR = (b.studentCount || 0) * (plan.perStudentCharge || 0);
      } else {
        amountPKR = plan.price || 0;
      }

      if (!amountPKR || amountPKR <= 0) {
        console.log('No charge for', b.schoolId, 'amountPKR=', amountPKR);
        // advance nextBillingDate
        await SchoolBilling.findByIdAndUpdate(b._id, { nextBillingDate: nextMonthDate(b.nextBillingDate || new Date()) });
        continue;
      }

      const amount = Math.round(amountPKR * 100);

      if (!b.stripeCustomerId) {
        // We don't have a saved customer/payment method — create a pending transaction and mark for manual payment
        await BillingTransaction.create({ schoolId: b.schoolId, amount: amountPKR, currency: 'PKR', status: 'failed', details: { reason: 'no_stripe_customer' } });
        console.warn('No stripeCustomerId for school', b.schoolId, 'skipping charge');
        continue;
      }

      // Create PaymentIntent for the customer. This will require that the customer has a default payment method setup.
      const pi = await stripe.paymentIntents.create({ amount, currency: 'pkr', customer: b.stripeCustomerId, off_session: true, confirm: true, metadata: { schoolId: b.schoolId, planKey: b.planKey } });

      const status = (pi.status === 'succeeded') ? 'succeeded' : 'pending';
      await BillingTransaction.create({ schoolId: b.schoolId, amount: amountPKR, currency: 'PKR', stripeChargeId: pi.id, status, details: { paymentIntent: pi } });

      // Update next billing date
      await SchoolBilling.findByIdAndUpdate(b._id, { nextBillingDate: nextMonthDate(b.nextBillingDate || new Date()), status: (status === 'succeeded' ? 'active' : 'past_due') });
      console.log('Billed', b.schoolId, amountPKR, 'PKR, status=', status);
    } catch (err) {
      console.error('Billing error for', b.schoolId, err.message || err);
      await BillingTransaction.create({ schoolId: b.schoolId, amount: 0, currency: 'PKR', status: 'failed', details: { error: err.message } });
    }
  }

  mongoose.disconnect();
}

function nextMonthDate(d) {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + 1);
  return dt;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

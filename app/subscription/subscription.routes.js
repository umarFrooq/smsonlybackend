const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../../models/SubscriptionPlan');
const SchoolBilling = require('../../models/SchoolBilling');
const BillingTransaction = require('../../models/BillingTransaction');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

// Create a Stripe Customer for a school (optional)
router.post('/create-customer', async (req, res) => {
  try {
    const { schoolId, name, email } = req.body;
    if (!schoolId) return res.status(400).json({ message: 'schoolId is required' });

    const customer = await stripe.customers.create({ name, email, metadata: { schoolId } });
    // Optionally store customer id in SchoolBilling
    await SchoolBilling.findOneAndUpdate({ schoolId }, { $set: { stripeCustomerId: customer.id } }, { upsert: true });
    res.json({ customerId: customer.id });
  } catch (err) {
    console.error('create-customer error', err);
    res.status(500).json({ message: err.message || 'Create customer failed' });
  }
});

// List available subscription plans (simple public endpoint)
router.post('/customer-portal', async (req, res) => {
  try {
    const { schoolId, returnUrl } = req.body;
    if (!schoolId) return res.status(400).json({ message: 'schoolId is required' });

    const billing = await SchoolBilling.findOne({ schoolId });
    if (!billing || !billing.stripeCustomerId) {
      return res.status(404).json({ message: 'No Stripe customer found for this school' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: returnUrl || (process.env.FRONTEND_URL || 'http://localhost:3000'),
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('customer-portal error', err);
    res.status(500).json({ message: err.message || 'Failed to create portal session' });
  }
});

// Activate a free trial for a school (one-click, bypass Stripe)
router.post('/activate-trial', async (req, res) => {
  try {
    let { schoolId } = req.body;
    if (!schoolId) return res.status(400).json({ message: 'schoolId is required' });

    // Normalize schoolId
    if (typeof schoolId === 'object') {
      schoolId = schoolId._id || schoolId.id || schoolId.schoolId || null;
    }

    if (!schoolId) return res.status(400).json({ message: 'Invalid schoolId provided' });

    const plan = await SubscriptionPlan.findOne({ key: 'trial', active: true });
    if (!plan) return res.status(404).json({ message: 'Trial plan not configured' });

    const billing = await SchoolBilling.findOne({ schoolId });
    if (billing) {
      return res.status(400).json({ message: 'Trial already used or active billing record exists' });
    }

    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    const update = {
      planKey: 'trial',
      status: 'trialing',
      trialUsed: true,
      nextBillingDate: nextMonth,
      studentCount: 0, // Will be updated later if needed
    };

    const newBilling = await SchoolBilling.findOneAndUpdate(
      { schoolId },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json({ message: 'Trial activated successfully', billing: newBilling });
  } catch (err) {
    console.error('activate-trial error', err);
    res.status(500).json({ message: err.message || 'Trial activation failed' });
  }
});

// List available subscription plans (simple public endpoint)
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ active: true }).lean();
    res.json({ plans });
  } catch (err) {
    console.error('list-plans error', err);
    res.status(500).json({ message: err.message || 'Failed to list plans' });
  }
});

// Create a Checkout Session for subscription purchase (recurring)
router.post('/create-subscription', async (req, res) => {
  try {
    let { planKey, schoolId, studentCount = 0, successUrl, cancelUrl } = req.body;
    if (!planKey) return res.status(400).json({ message: 'planKey is required' });

    // Normalize schoolId: accept either an id string or a school object
    if (schoolId && typeof schoolId === 'object') {
      // Try common id fields
      schoolId = schoolId._id || schoolId.id || schoolId.schoolId || (schoolId._doc && schoolId._doc._id) || null;
    }

    if (!schoolId) return res.status(400).json({ message: 'schoolId is required' });

    const plan = await SubscriptionPlan.findOne({ key: planKey, active: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // Prevent repeat trial subscriptions: if requesting 'trial' and school has used trial before, block
    const existingBilling = await SchoolBilling.findOne({ schoolId });
    if (planKey === 'trial') {
      if (existingBilling && (existingBilling.planKey === 'trial' || existingBilling.trialUsed || existingBilling.status === 'trialing')) {
        return res.status(400).json({ message: 'Trial already used for this school' });
      }
    }

    if (!plan.priceId) return res.status(400).json({ message: 'Plan priceId not configured in Stripe' });

    // If studentCount not provided for custom plan, compute from users collection
    if (planKey === 'custom' && (!studentCount || Number(studentCount) <= 0)) {
      try {
        // Lazy require to avoid circular issues
        const User = require('../user/user.model');
        const count = await User.countDocuments({ role: 'student', schoolId });
        studentCount = Math.max(1, count || 1);
      } catch (e) {
        // If counting fails, fall back to 1
        console.warn('Failed to compute studentCount, defaulting to 1', e.message || e);
        studentCount = 1;
      }
    }

    // Ensure we have a Stripe customer if school has one
    const billing = await SchoolBilling.findOne({ schoolId });
    let customer = billing?.stripeCustomerId;

    const line_items = [{ price: plan.priceId, quantity: planKey === 'custom' ? (Number(studentCount) || 1) : 1 }];

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items,
      success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || (process.env.FRONTEND_URL || 'http://localhost:3000'),
      customer,
      metadata: { planKey, schoolId: String(schoolId), studentCount: planKey === 'custom' ? `${studentCount}` : '1' },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('create-subscription error', err);
    res.status(500).json({ message: err.message || 'Create subscription failed' });
  }
});

// Verify Checkout Session and record subscription details (no webhooks)
router.post('/verify-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const subscriptionId = session.subscription;
    const customerId = session.customer;
    const meta = session.metadata || {};
    const planKey = meta.planKey || '';
    const schoolId = meta.schoolId || null;
    const studentCount = parseInt(meta.studentCount || '0', 10) || 0;

    // Retrieve subscription details
    let subscription = null;
    if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['latest_invoice'] });
    }

    // Persist transaction and billing info
    if (subscription) {
      // create a BillingTransaction for initial invoice if present
      const invoice = subscription.latest_invoice;
      if (invoice) {
        const amountPKR = (invoice.amount_paid || invoice.amount_due || 0) / 100;
        await BillingTransaction.create({ schoolId: schoolId || undefined, amount: amountPKR, currency: (invoice.currency || 'pkr').toUpperCase(), stripeChargeId: invoice.charge || undefined, invoiceId: invoice.id, status: invoice.paid ? 'succeeded' : 'pending', details: { invoice } });
      }

      // Update SchoolBilling
      await SchoolBilling.findOneAndUpdate({ schoolId }, { $set: { planKey, studentCount, stripeCustomerId: customerId, stripeSubscriptionId: subscription.id, status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'past_due', nextBillingDate: new Date((subscription.current_period_end || 0) * 1000), trialUsed: planKey === 'trial' ? true : undefined } }, { upsert: true });
    } else {
      // session without subscription (edge-case)
      await SchoolBilling.findOneAndUpdate({ schoolId }, { $set: { planKey, studentCount, stripeCustomerId: customerId, trialUsed: planKey === 'trial' ? true : undefined } }, { upsert: true });
    }

    res.json({ message: 'Session verified', subscriptionId, session });
  } catch (err) {
    console.error('verify-session error', err);
    res.status(500).json({ message: err.message || 'Verification failed' });
  }
});

// Create a PaymentIntent for a plan purchase
router.post('/checkout', async (req, res) => {
  try {
    const { planKey, schoolId, studentCount = 0 } = req.body;
    if (!planKey) return res.status(400).json({ message: 'planKey is required' });

    const plan = await SubscriptionPlan.findOne({ key: planKey, active: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    let amountPKR = 0;
    if (planKey === 'custom') {
      if (!studentCount) return res.status(400).json({ message: 'studentCount is required for custom plan' });
      amountPKR = studentCount * (plan.perStudentCharge || 0);
    } else {
      amountPKR = plan.price || 0;
    }

    // Convert to smallest currency unit (paisa)
    const amount = Math.round((amountPKR || 0) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: (plan.currency || 'PKR').toLowerCase(),
      metadata: { planKey, schoolId: schoolId || '', studentCount: studentCount || 0 },
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error('checkout error', err);
    res.status(500).json({ message: err.message || 'Checkout failed' });
  }
});

// Verify a PaymentIntent after the client confirms payment (no webhooks)
router.post('/verify', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ message: 'paymentIntentId is required' });

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['charges.data.balance_transaction'] });

    if (!pi) return res.status(404).json({ message: 'PaymentIntent not found' });

    // Accept succeeded status only
    if (pi.status !== 'succeeded' && pi.status !== 'requires_capture') {
      return res.status(400).json({ message: 'Payment not completed', status: pi.status });
    }

    const meta = pi.metadata || {};
    const planKey = meta.planKey || '';
    const schoolId = meta.schoolId || null;
    const studentCount = parseInt(meta.studentCount || '0', 10) || 0;

    // Create billing transaction
    const amountPKR = (pi.amount_received || pi.amount || 0) / 100;
    const trx = await BillingTransaction.create({
      schoolId: schoolId || undefined,
      amount: amountPKR,
      currency: (pi.currency || 'pkr').toUpperCase(),
      stripeChargeId: pi.charges?.data?.[0]?.id,
      invoiceId: pi.charges?.data?.[0]?.invoice,
      status: 'succeeded',
      details: { paymentIntent: pi },
    });

    // Update or create SchoolBilling record
    if (schoolId) {
      await SchoolBilling.findOneAndUpdate(
        { schoolId },
        { $set: { planKey, studentCount, status: 'active', stripeCustomerId: pi.customer || undefined, nextBillingDate: computeNextMonth() } },
        { upsert: true }
      );
    }

    res.json({ message: 'Payment verified', transactionId: trx._id });
  } catch (err) {
    console.error('verify error', err);
    res.status(500).json({ message: err.message || 'Verification failed' });
  }
});

function computeNextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
}

// Get billing info for a school
router.get('/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const billing = await SchoolBilling.findOne({ schoolId });
    res.json({ billing });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get billing info' });
  }
});

// Upgrade or change plan for a school and optionally charge immediately
router.post('/upgrade', async (req, res) => {
  try {
    const { schoolId, planKey, studentCount = 0, chargeImmediately = false } = req.body;
    if (!schoolId || !planKey) return res.status(400).json({ message: 'schoolId and planKey are required' });

    const plan = await SubscriptionPlan.findOne({ key: planKey, active: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // Always mark subscription active on upgrade so schools are not left on past_due from an old trial
    const update = { planKey, studentCount, status: 'active' };
    const billing = await SchoolBilling.findOneAndUpdate({ schoolId }, { $set: update }, { new: true, upsert: true });

    let transaction = null;
    if (chargeImmediately) {
      let amountPKR = 0;
      if (planKey === 'custom') {
        amountPKR = studentCount * (plan.perStudentCharge || 0);
      } else {
        amountPKR = plan.price || 0;
      }

      const amount = Math.round(amountPKR * 100);
      if (!billing.stripeCustomerId) {
        // create a one-off PaymentIntent without customer
        const pi = await stripe.paymentIntents.create({ amount, currency: (plan.currency || 'PKR').toLowerCase(), metadata: { planKey, schoolId } });
        transaction = await BillingTransaction.create({ schoolId, amount: amountPKR, currency: (plan.currency || 'PKR'), stripeChargeId: pi.id, status: 'pending', details: { paymentIntent: pi } });
      } else {
        // try charging the saved customer
        const pi = await stripe.paymentIntents.create({ amount, currency: (plan.currency || 'PKR').toLowerCase(), customer: billing.stripeCustomerId, metadata: { planKey, schoolId } });
        transaction = await BillingTransaction.create({ schoolId, amount: amountPKR, currency: (plan.currency || 'PKR'), stripeChargeId: pi.id, status: 'pending', details: { paymentIntent: pi } });
      }
    }

    res.json({ message: 'Plan updated', billing, transaction });
  } catch (err) {
    console.error('upgrade error', err);
    res.status(500).json({ message: err.message || 'Upgrade failed' });
  }
});

// Cancel a school's active Stripe subscription
router.post('/cancel', async (req, res) => {
  try {
    const { schoolId } = req.body;
    if (!schoolId) return res.status(400).json({ message: 'schoolId is required' });

    const billing = await SchoolBilling.findOne({ schoolId });
    if (!billing || !billing.stripeSubscriptionId) return res.status(404).json({ message: 'No active subscription found for this school' });

    // Cancel subscription at period end = false to cancel immediately
    const sub = await stripe.subscriptions.del(billing.stripeSubscriptionId);

    // Update billing record
    await SchoolBilling.findOneAndUpdate({ schoolId }, { $set: { status: sub.status || 'canceled', nextBillingDate: null, stripeSubscriptionId: sub.id } }, { new: true });

    res.json({ message: 'Subscription cancelled', subscription: sub });
  } catch (err) {
    console.error('cancel subscription error', err);
    res.status(500).json({ message: err.message || 'Cancel failed' });
  }
});

module.exports = router;

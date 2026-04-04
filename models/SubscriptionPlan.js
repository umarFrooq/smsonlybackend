const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubscriptionPlanSchema = new Schema({
  key: { type: String, required: true, unique: true }, // e.g. 'trial','premium','custom'
  name: { type: String, required: true },
  price: { type: Number, default: 0 }, // monthly price in PKR
  priceId: { type: String, default: '' }, // Stripe Price ID for recurring subscriptions
  currency: { type: String, default: 'PKR' },
  monthlyQuota: { type: Number, default: 0 }, // e.g. messages/month
  studentLimit: { type: Number, default: 0 }, // max students (0 for unlimited)
  perStudentCharge: { type: Number, default: 0 }, // per-student charge for 'custom'
  description: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const SchoolBillingSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  planKey: { type: String, required: true },
  studentCount: { type: Number, default: 0 },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  nextBillingDate: { type: Date },
  status: { type: String, enum: ['active','trialing','past_due','cancelled'], default: 'active' },
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('SchoolBilling', SchoolBillingSchema);

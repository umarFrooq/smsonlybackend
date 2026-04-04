const mongoose = require('mongoose');
const { Schema } = mongoose;

const BillingTransactionSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'PKR' },
  stripeChargeId: { type: String },
  invoiceId: { type: String },
  status: { type: String, enum: ['pending','succeeded','failed'], default: 'pending' },
  details: Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('BillingTransaction', BillingTransactionSchema);

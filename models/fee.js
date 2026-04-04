const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  amount: { type: Number, required: true }, // Monthly fee amount
  paid: { type: Number, default: 0 }, // Amount paid for this month
  arrears: { type: Number, default: 0 }, // Unpaid amount from previous months
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who added
  createdAt: { type: Date, default: Date.now }
});

FeeSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.models.Fee || mongoose.model('Fee', FeeSchema);
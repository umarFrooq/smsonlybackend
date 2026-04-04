// analytics.model.js
// Mongoose model for analytics events

const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  module: { type: String, required: true },
  action: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  details: { type: Object },
  createdAt: { type: Date, default: Date.now, index: true }
});

analyticsEventSchema.index({ module: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);

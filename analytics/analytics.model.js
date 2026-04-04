const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  event: String,
  userId: String,
  timestamp: { type: Date, default: Date.now },
  metadata: Object,
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
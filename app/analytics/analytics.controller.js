// analytics.controller.js
// New Analytics Controller for handling analytics-related backend logic

const AnalyticsService = require('./analytics.service');

module.exports = {
  logEvent: async (req, res) => {
    try {
      const { module, action, userId, details } = req.body;
      await AnalyticsService.logEvent({ module, action, userId, details });
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
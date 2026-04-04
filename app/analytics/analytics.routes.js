

// analytics.routes.js
// Routes for analytics endpoints

const AnalyticsController = require('./analytics.controller');

router.post('/log', AnalyticsController.logEvent);

module.exports = router;
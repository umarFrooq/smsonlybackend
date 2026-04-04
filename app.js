const express = require('express');
const app = express();

// Importing the analytics routes
const analyticsRoutes = require('./analytics/analytics.routes');

// Using the analytics routes for the '/api/analytics' endpoint
app.use('/api/analytics', analyticsRoutes);

// ...existing code for other routes and middleware

module.exports = app;
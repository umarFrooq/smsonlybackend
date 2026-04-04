const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');

router.post('/log', controller.logEvent);
router.get('/bookings-per-day', controller.getBookingsPerDay);

module.exports = router;
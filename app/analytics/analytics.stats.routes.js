// analytics.stats.routes.js
// API routes for analytics stats

const express = require('express');
const router = express.Router();
const statsService = require('./analytics.stats.service');

router.get('/all', async (req, res) => {
  try {
    const stats = await statsService.getAllStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

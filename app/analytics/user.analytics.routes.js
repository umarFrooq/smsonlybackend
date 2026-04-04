// user.analytics.routes.js
// API route for user analytics

const express = require('express');
const router = express.Router();
const { getUserAnalytics } = require('./user.analytics.service');
const auth = require('../../middlewares/auth');

router.get('/summary', auth('getAnalytics', 'viewSystemAnalytics'), async (req, res) => {
  try {
    const { from, to, role, branchId, status, schoolId } = req.query;
    const stats = await getUserAnalytics({ from, to, role, branchId, schoolId, status }, req.user);
    res.json(stats);
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message });
  }
});

module.exports = router;

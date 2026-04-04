


// analytics.validation.js
// Validation for analytics events

const validateLogEvent = (req, res, next) => {
  const { module, action, userId } = req.body;
  if (!module || !action || !userId) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  next();
};

module.exports = { validateLogEvent };

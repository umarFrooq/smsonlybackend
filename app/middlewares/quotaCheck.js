const SchoolBilling = require('../../models/SchoolBilling');
const SubscriptionPlan = require('../../models/SubscriptionPlan');
const User = require('../user/user.model');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');

/**
 * quotaCheck middleware
 * - Checks if the school has reached its student limit
 * - Intended for use on student creation routes
 */
module.exports = async function quotaCheck(req, res, next) {
  try {
    const schoolId = req.user?.schoolId || req.schoolId || req.body?.schoolId;
    if (!schoolId) return next(); // Cannot check without schoolId

    const billing = await SchoolBilling.findOne({ schoolId }).lean();
    if (!billing) {
      return res.status(402).json({ code: 'SUBSCRIPTION_REQUIRED', message: 'No active subscription found.' });
    }

    const plan = await SubscriptionPlan.findOne({ key: billing.planKey }).lean();
    if (!plan) return next(); // Plan not found, proceed cautiously

    const limit = plan.studentLimit;
    if (limit && limit > 0) {
      const currentCount = await User.countDocuments({ role: 'student', schoolId });
      if (currentCount >= limit) {
        return res.status(403).json({
          code: 'QUOTA_EXCEEDED',
          message: `Your current plan (${plan.name}) is limited to ${limit} students. Please upgrade to add more.`,
          limit,
          currentCount
        });
      }
    }

    return next();
  } catch (err) {
    console.error('quotaCheck error', err);
    return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Quota validation failed'));
  }
};

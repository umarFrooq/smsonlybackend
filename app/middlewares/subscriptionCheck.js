const SchoolBilling = require('../../models/SchoolBilling');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');
const url = require('url');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');

// Config: path prefixes that are allowed without subscription validation
// STRICT WHITELIST: only these prefixes are allowed publicly
const ALLOWED_PREFIXES = [
  // v1 public endpoints
  '/v1/auth/login', // login
  '/v1/auth/register', // registration
  '/v1/auth/public', // public auth endpoints (if used)
  '/v1/subscriptions', // subscription creation/verification endpoints (create + verify)
  '/v1/payment', // payment endpoints
  '/v1/webhook', // webhooks (if you later enable webhooks)
  '/v1/health-check',
  '/v1/doc',
  // v2 public endpoints (same semantics)
  '/v2/auth/login',
  '/v2/auth/register',
  '/v2/auth/public',
  '/v2/subscriptions',
  '/v2/payment',
  '/v2/webhook',
  '/v2/health-check',
  '/v2/doc',
];

function isAllowedPath(req) {
  // allow preflight
  if ((req.method || '').toUpperCase() === 'OPTIONS') return true;
  const pathname = url.parse(req.originalUrl || req.url).pathname;
  return ALLOWED_PREFIXES.some(p => pathname.startsWith(p));
}

/**
 * subscriptionCheck middleware
 * - Exempts public routes and platform owners (platformAdmin / rootUser)
 * - If school's billing status is not active or trialing -> block
 *   - For other roles: respond 402 with JSON instructing to contact billing
 */
// Simple in-memory cache for SchoolBilling lookups to reduce DB reads
const CACHE_TTL = 30 * 1000; // 30 seconds
const billingCache = new Map(); // key -> { ts, value }

async function getBillingCached(schoolId) {
  const entry = billingCache.get(String(schoolId));
  const now = Date.now();
  if (entry && (now - entry.ts) < CACHE_TTL) return entry.value;
  const value = await SchoolBilling.findOne({ schoolId }).lean();
  billingCache.set(String(schoolId), { ts: now, value });
  return value;
}

module.exports = async function subscriptionCheck(req, res, next) {
  try {
    // If the path is explicitly allowed (login, registration, subscriptions/payment/webhooks, health/doc), skip check
    if (isAllowedPath(req)) return next();

    // Decode JWT once (runs before route-level passport on many requests)
    let jwtPayload = null;
    const authHeader = (req.headers.authorization || req.headers.Authorization || '');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        jwtPayload = jwt.verify(token, config.jwt.secret);
      } catch (e) {
        // invalid token: treat as no subscription context below
      }
    }

    // Platform owner: no school on token; must not be forced through per-school billing
    if (jwtPayload && (jwtPayload.role === 'platformAdmin' || jwtPayload.role === 'rootUser')) {
      return next();
    }

    // If authentication middleware hasn't populated `req.user` yet, attach schoolId from JWT
    let user = req.user || {};
    if (!user.schoolId && jwtPayload) {
      let sid = jwtPayload.schoolId || jwtPayload.school_id;
      if (sid && typeof sid === 'object') {
        sid = sid._id || sid.id || sid.schoolId || sid.toString();
      }
      if (sid) {
        req.user = req.user || {};
        req.user.schoolId = sid;
        user.schoolId = sid;
      }
    }

    // For school-scoped users we require a schoolId (unless allowed above)
    const schoolId = (req.user && req.user.schoolId) || req.headers['x-school-id'] || req.query.schoolId;
    if (!schoolId) {
      // No schoolId and not an allowed path -> block
      return res.status(402).json({ code: 'SUBSCRIPTION_REQUIRED', message: 'School subscription required. Please login or contact support.', contact: process.env.SUPPORT_EMAIL || 'billing@yourdomain.com' });
    }

    const billing = await getBillingCached(schoolId);
    let status = billing?.status;

    // Trial Expiry Check: if status is 'trialing' but nextBillingDate is past, it's expired
    if (status === 'trialing' && billing.nextBillingDate && new Date(billing.nextBillingDate) < new Date()) {
      // Update status to 'past_due' (expired) in DB (don't wait for it to finish)
      SchoolBilling.updateOne({ schoolId }, { $set: { status: 'past_due' } }).catch(e => console.error('Expiry update failed', e));
      // Update local status for immediate blockade
      status = 'past_due';
      // Clear cache for this schoolId
      billingCache.delete(String(schoolId));
    }

    // If no billing record or not active/trialing -> block with JSON 402
    if (!billing || !['active', 'trialing'].includes(status)) {
      return res.status(402).json({
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'School subscription is inactive or expired. Contact billing or upgrade your plan.',
        contact: process.env.SUPPORT_EMAIL || 'billing@yourdomain.com'
      });
    }

    // If billing record exists but is not active/trialing we already blocked above.
    // Avoid blocking active subscriptions just because `nextBillingDate` is missing or incorrectly set.
    // Only treat a subscription as expired when its status explicitly indicates so (e.g., 'past_due' or 'cancelled').
    // (This prevents cases where `nextBillingDate` is 0/epoch and would otherwise incorrectly block access.)
    // No additional check needed here.

    return next();
  } catch (err) {
    // If something goes wrong, be conservative: block access with 403
    console.error('subscriptionCheck error', err);
    return next(new ApiError(httpStatus.FORBIDDEN, 'Subscription validation failed'));
  }
};

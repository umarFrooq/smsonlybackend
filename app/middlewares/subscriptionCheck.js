const SchoolBilling = require('../../models/SchoolBilling');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');
const url = require('url');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const mongoose = require('mongoose');
const User = require('../user/user.model');

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

function requestPathname(req) {
  return url.parse(req.originalUrl || req.url || '').pathname || '';
}

function isAllowedPath(req) {
  // allow preflight
  if ((req.method || '').toUpperCase() === 'OPTIONS') return true;
  const pathname = requestPathname(req);
  return ALLOWED_PREFIXES.some(p => pathname.startsWith(p));
}

/**
 * subscriptionCheck middleware
 * - Exempts public routes and platform owners (platformAdmin / rootUser)
 * - If school's billing status is not active or trialing -> block
 *   - For other roles: respond 402 with JSON instructing to contact billing
 */
/**
 * Bearer token from common header shapes (avoids split(' ')[1] failing on double spaces / casing).
 */
function extractBearerToken(req) {
  const raw =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    (typeof req.get === 'function' && req.get('authorization')) ||
    '';
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Normalize any schoolId shape (ObjectId, populated { id }, string) to a string for queries.
 */
function normalizeSchoolId(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'string' || typeof raw === 'number') {
    const s = String(raw).trim();
    return s || null;
  }
  if (typeof raw === 'object') {
    if (raw.$oid) return String(raw.$oid);
    if (raw._id != null) return normalizeSchoolId(raw._id);
    if (raw.id != null) return normalizeSchoolId(raw.id);
    if (raw.schoolId != null) return normalizeSchoolId(raw.schoolId);
    if (typeof raw.toHexString === 'function') {
      try {
        return raw.toHexString();
      } catch (e) {
        /* ignore */
      }
    }
    if (typeof raw.toString === 'function') {
      const t = raw.toString();
      if (/^[a-f0-9]{24}$/i.test(t)) return t;
    }
  }
  return null;
}

function schoolIdFromJwtPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [payload.schoolId, payload.school_id, payload.school];
  for (const c of candidates) {
    const n = normalizeSchoolId(c);
    if (n) return n;
  }
  return null;
}

// Simple in-memory cache for SchoolBilling lookups to reduce DB reads
const CACHE_TTL = 30 * 1000; // 30 seconds
const billingCache = new Map(); // key -> { ts, value }

const userSchoolCache = new Map(); // userId string -> { ts, value: schoolId string|null }

async function getSchoolIdForUserCached(userId) {
  if (!userId) return null;
  const key = String(userId);
  const entry = userSchoolCache.get(key);
  const now = Date.now();
  if (entry && now - entry.ts < CACHE_TTL) return entry.value;
  let sid = null;
  try {
    if (mongoose.Types.ObjectId.isValid(key)) {
      // Use native collection so mongoose-autopopulate on User.schoolId cannot strip/shape the ref
      const oid = new mongoose.Types.ObjectId(key);
      const u = await User.collection.findOne({ _id: oid }, { projection: { schoolId: 1 } });
      sid = normalizeSchoolId(u?.schoolId);
    }
  } catch (e) {
    console.error('subscriptionCheck user school lookup failed', e && e.message ? e.message : e);
  }
  userSchoolCache.set(key, { ts: now, value: sid });
  return sid;
}

async function getBillingCached(schoolId) {
  const key = String(schoolId);
  const entry = billingCache.get(key);
  const now = Date.now();
  if (entry && now - entry.ts < CACHE_TTL) return entry.value;
  const or = [];
  if (mongoose.Types.ObjectId.isValid(key)) {
    or.push({ schoolId: new mongoose.Types.ObjectId(key) });
  }
  or.push({ schoolId: key });
  const value = or.length ? await SchoolBilling.findOne({ $or: or }).lean() : null;
  billingCache.set(key, { ts: now, value });
  return value;
}

module.exports = async function subscriptionCheck(req, res, next) {
  try {
    // If the path is explicitly allowed (login, registration, subscriptions/payment/webhooks, health/doc), skip check
    if (isAllowedPath(req)) return next();

    // Decode JWT once (runs before route-level passport on many requests)
    let jwtPayload = null;
    const bearer = extractBearerToken(req);
    let jwtVerifyError = null;
    if (bearer) {
      try {
        jwtPayload = jwt.verify(bearer, config.jwt.secret);
      } catch (e) {
        jwtVerifyError = e;
        jwtPayload = null;
      }
    }

    const pathname = requestPathname(req);
    const needsCredentialedApi =
      (pathname.startsWith('/v2/') || pathname.startsWith('/v1/')) && !isAllowedPath(req);

    if (needsCredentialedApi) {
      if (!bearer) {
        res.locals.errorMessage = 'AUTH_MISSING_BEARER';
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authorization bearer token required' });
      }
      if (!jwtPayload) {
        res.locals.errorMessage = `AUTH_INVALID_JWT:${jwtVerifyError && jwtVerifyError.name ? jwtVerifyError.name : 'verify_failed'}`;
        return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Invalid or expired access token' });
      }
    }

    // Platform owner: no school on token; must not be forced through per-school billing
    if (jwtPayload && (jwtPayload.role === 'platformAdmin' || jwtPayload.role === 'rootUser')) {
      return next();
    }

    // If authentication middleware hasn't populated `req.user` yet, attach schoolId from JWT
    // (subscription runs before passport on /v1 and /v2).
    let user = req.user || {};
    let resolvedFromJwt = normalizeSchoolId(user.schoolId);
    if (!resolvedFromJwt && jwtPayload) {
      resolvedFromJwt = schoolIdFromJwtPayload(jwtPayload);
      if (resolvedFromJwt) {
        req.user = req.user || {};
        req.user.schoolId = resolvedFromJwt;
        user.schoolId = resolvedFromJwt;
      }
    }

    // Verified JWT but no school on token (older tokens / edge cases): resolve from user record
    if (!resolvedFromJwt && jwtPayload && jwtPayload.sub) {
      const fromDb = await getSchoolIdForUserCached(jwtPayload.sub);
      if (fromDb) {
        resolvedFromJwt = fromDb;
        req.user = req.user || {};
        req.user.schoolId = fromDb;
      }
    }

    // For school-scoped users we require a schoolId (unless allowed above)
    const headerOrQuery =
      normalizeSchoolId(req.headers['x-school-id']) ||
      normalizeSchoolId(req.query && req.query.schoolId);
    const schoolId = resolvedFromJwt || headerOrQuery;
    if (!schoolId) {
      res.locals.errorMessage = 'SUBSCRIPTION_REQUIRED:no_schoolId';
      return res.status(402).json({ code: 'SUBSCRIPTION_REQUIRED', message: 'School subscription required. Please login or contact support.', contact: process.env.SUPPORT_EMAIL || 'billing@yourdomain.com' });
    }

    const billing = await getBillingCached(schoolId);
    let status = (billing?.status || '').toString().trim().toLowerCase();

    // Trial Expiry Check: if status is 'trialing' but nextBillingDate is past, it's expired
    if (status === 'trialing' && billing && billing.nextBillingDate && new Date(billing.nextBillingDate) < new Date()) {
      // Update status to 'past_due' (expired) in DB (don't wait for it to finish)
      SchoolBilling.updateOne({ schoolId }, { $set: { status: 'past_due' } }).catch(e => console.error('Expiry update failed', e));
      // Update local status for immediate blockade
      status = 'past_due';
      // Clear cache for this schoolId
      billingCache.delete(String(schoolId));
    }

    // If no billing record or not active/trialing -> block with JSON 402
    if (!billing || !['active', 'trialing'].includes(status)) {
      res.locals.errorMessage = `SUBSCRIPTION_INACTIVE:school=${schoolId}:status=${billing ? status || 'unknown' : 'no_row'}`;
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

const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const loger = require('./logger');
const en = require('../config/locales/en')

const normalizeRole = (role) => (role === 'rootUser' ? 'platformAdmin' : role);

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'AUTHENTICATION'));
  }
  req.user = user;

  // If no specific rights are required, just proceed
  if (!requiredRights || requiredRights.length === 0) {
    return resolve();
  }

  // Determine the rights available to this user. 
  // Merge user.access (from RBAC collection) with static roleRights (from config).
  // This ensures that new permissions in code are immediately available.
  const normalizedRole = normalizeRole(user.role);
  const staticRights = [
    ...(roleRights.get(normalizedRole) || []),
    ...(roleRights.get(user.role) || []),
  ];
  const dynamicRights = Array.isArray(user.access) ? user.access : [];
  const userRights = [...new Set([...staticRights, ...dynamicRights])];

  if (!userRights || userRights.length === 0) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }

  // requiredRights may come in as an array of strings if auth was called with multiple args
  const required = Array.isArray(requiredRights) ? requiredRights : [requiredRights];

  const hasAnyRequiredRight = required.some((requiredRight) => userRights.includes(requiredRight));

  // Allow some resource-scoped fallbacks:
  // - If the user is acting on their own resource (userId param)
  // - If the route carries a schoolId param and the user's schoolId matches it (school-scoped admin)
  const isActingOnSelf = req.params.userId && req.params.userId === user.id;
  const isActingOnOwnSchool = req.params.schoolId && user.schoolId && String(user.schoolId) === String(req.params.schoolId);

  if (!hasAnyRequiredRight && !isActingOnSelf && !isActingOnOwnSchool) {
    // Debug information to help trace why permission check failed
    console.error('[auth] Forbidden - user:', {
      id: user.id || user._id,
      role: user.role,
      userSchoolId: user.schoolId,
      access: user.access,
      params: req.params,
      requiredRights: required,
      isActingOnSelf,
      isActingOnOwnSchool,
    });
    return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
  }

  // Clean up transient access array so it doesn't leak downstream
  if (user.access) delete user.access;

  resolve();
};

const auth = (...requiredRights) => async (req, res, next) => {
  // support calling auth() with zero, one or many right strings
  return new Promise((resolve, reject) => {
    // Debug helper: attach requiredRights array to request for later logging in verifyCallback
    req._requiredRights = requiredRights || [];
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
  })
    .then(() => {
      // try{
      //   loger(req, res);
      // }
      // catch(err){ next()};
      next()
    })
    .catch((err) => next(err));
};

module.exports = auth;

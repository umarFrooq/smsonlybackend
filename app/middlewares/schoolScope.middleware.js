const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const { roles } = require('../../config/roles'); // To access role strings

const isPlatformAdminRole = (role) => role === 'platformAdmin' || role === 'rootUser';

const schoolScopeMiddleware = (req, res, next) => {
  if (!req.user) {
    // This should ideally be caught by the auth middleware first
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated'));
  }

  const userRole = req.user.role;

  // Define roles that are expected to be scoped to a school
  // 'superadmin' is the main one from the original request.
  // 'admin' (if it's a school-level admin), 'teacher' are other examples.
  const schoolScopedRoles = [
    roles.find(r => r === 'superadmin'),
    roles.find(r => r === 'admin'), // Assuming 'admin' can also be school-scoped
    roles.find(r => r === 'teacher'),
    roles.find(r => r === 'student') // Added student role
    // Add other roles like 'parent' if they are strictly tied to a school context from login
  ].filter(Boolean); // Filter out undefined if a role string isn't found (should not happen if config is correct)


  if (schoolScopedRoles.includes(userRole)) {
    if (!req.user.schoolId) {
      // A user with a school-scoped role MUST have a schoolId.
      // This indicates a data integrity problem or misconfiguration for this user.
      return next(new ApiError(httpStatus.FORBIDDEN, 'User is not associated with a school or school association is missing.'));
    }
    req.schoolId = req.user.schoolId.toString(); // Ensure it's a string if it's an ObjectId
  } else if (isPlatformAdminRole(userRole)) {
    // platformAdmin/rootUser is not scoped to a single school by this middleware.
    // If a platformAdmin needs to operate on a specific school, that school's ID
    // must be provided in the request (e.g., as a param or body field)
    // and handled by the controller/service.
    // For now, req.schoolId will remain undefined for platform admin from this middleware.
  } else {
    // Handle other roles if necessary, or assume they are not school-scoped by default
    // For example, a generic 'user' role might not be school-scoped unless explicitly made so.
  }

  return next();
};

module.exports = schoolScopeMiddleware;

// user.analytics.service.js
// Analytics for User model: total users, active users, teachers (branch/school), students, etc.

const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const { getSchoolAnalytics, getPlatformAnalytics } = require('./analytics.service');
const rootSchoolInsights = require('./rootSchoolInsights.service');

function resolveSchoolId(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object' && raw.id) return raw.id;
  if (typeof raw === 'object' && raw._id) return raw._id.toString();
  return raw;
}

/** Platform admin does not consume school attendance (present/absent) aggregates */
function omitAttendanceFields(stats) {
  if (!stats || typeof stats !== 'object') return stats;
  const {
    presentTeachers,
    absentTeachers,
    presentStudents,
    absentStudents,
    attendanceTrends,
    ...rest
  } = stats;
  return rest;
}

/**
 * School users (admin / superadmin): scoped to their school.
 * Root: platform-wide when schoolId is omitted; school drill-down when schoolId is provided.
 */
async function getUserAnalytics({ from, to, role, branchId, schoolId: schoolIdFromQuery, status }, user) {
  if (user.role === 'platformAdmin' || user.role === 'rootUser') {
    const schoolId = schoolIdFromQuery || null;
    if (schoolId) {
      const stats = await getSchoolAnalytics({ schoolId, branchId, from, to });
      await rootSchoolInsights.attachRootSingleSchoolInsights(stats, schoolId);
      return omitAttendanceFields(stats);
    }
    const stats = await getPlatformAnalytics({ from, to });
    stats.schoolsOverview = await rootSchoolInsights.getRootSchoolsOverview();
    return omitAttendanceFields(stats);
  }

  const schoolId = resolveSchoolId(user.schoolId);
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for analytics');
  }
  return getSchoolAnalytics({ schoolId, branchId, from, to });
}

module.exports = { getUserAnalytics };

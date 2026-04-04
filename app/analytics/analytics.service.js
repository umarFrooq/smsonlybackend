const { User } = require('../../config/mongoose')
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const mongoose = require("mongoose");
const config = require("../../config/config");
// analytics.service.js
// Clean, event-based analytics service for low-latency analytics across all modules

const AnalyticsEvent = require('./analytics.model');


/**
 * Log an analytics event from any module
 * @param {Object} param0
 * @param {string} param0.module - Module name (e.g. 'user', 'payment', 'auth', etc.)
 * @param {string} param0.action - Action performed (e.g. 'login', 'create', 'update')
 * @param {string|ObjectId} param0.userId - User ID
 * @param {Object} [param0.details] - Additional details
 */
const logEvent = async ({ module, action, userId, details }) => {
  try {
    await AnalyticsEvent.create({ module, action, userId, details });
  } catch (err) {
    console.error('Failed to log analytics event:', err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to log analytics event');
  }
};

/**
 * Get fast aggregated stats for a module/action
 * @param {string} module - Module name
 * @param {string} [action] - Action name
 * @param {string|Date} [from] - Start date
 * @param {string|Date} [to] - End date
 * @returns {Promise<Array>} Aggregated stats
 */
const getModuleStats = async (module, action, from, to) => {
  const match = { module };
  if (action) match.action = action;
  if (from || to) match.createdAt = {};
  if (from) match.createdAt.$gte = new Date(from);
  if (to) match.createdAt.$lte = new Date(to);
  return AnalyticsEvent.aggregate([
    { $match: match },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};



const usersMonthlyAnalytics = async (prev, curr, top) => {
  try {
    // Exclude root/superadmin users from analytics
    let user_query = [
      {
        '$match': {
          ...curr,
          role: { $ne: 'superadmin' } // Exclude root/superadmin
        }
      },
      {
        '$facet': {
          'currMonthUsers': [
            {
              '$group': {
                '_id': '$role',
                'total': {
                  '$sum': 1
                }
              }
            },
            {
              '$project': {
                'role': '$_id',
                'total': 1,
                '_id': 0
              }
            }
          ],
          'currMonthTotalUsers': [
            {
              '$count': 'total'
            }
          ]
        }
      }
    ];

    let users = await User.aggregate(user_query);
    let userStats = {
      currMonthUsers: {},
      session: {}
    };

    if (users && users.length) {
      users = users[0];
      users.currMonthUsers.forEach(user => {
        userStats['currMonthUsers'][user.role] = user.total;
      });
      userStats.currMonthTotalUsers = users.currMonthTotalUsers || 0;
    }

    return userStats;
  } catch (err) {
    console.error('Error in usersMonthlyAnalytics:', err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch user analytics');
  }
};

const orderChart = async (user, startDate, endDate, format) => {
  try {
    let chart_query = [
      {
        '$match': {
          'createdAt': {
            '$gte': new Date(startDate),
            '$lte': new Date(endDate)
          }
        }
      },
      {
        '$addFields': {
          'createdAt': {
            '$cond': {
              'if': {
                '$eq': [
                  {
                    '$type': '$createdAt'
                  }, 'date'
                ]
              },
              'then': '$createdAt',
              'else': null
            }
          }
        }
      }
    ];

    if (user.role === 'supplier') {
      chart_query[0]['$match']['seller'] = mongoose.Types.ObjectId(user._id);
    }

    let ordersChart = await Order.aggregate(chart_query).read("secondary");
    return { isSuccess: true, status: 200, data: ordersChart, message: 'Orders Chart' };
  } catch (err) {
    console.error('Error in orderChart:', err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch order chart');
  }
};


const videosMonthlyAnalytics = async (date, token) => {
  let payload = {}
  let options = {
    method: 'GET',
    url: `${streamingEndpoints.GET_MONTHLY_ANALYTICS}?date=${date}`,
    headers: {
      Authorization: token
    }
  }

  let data = await streamingUtils(payload, options)
  let result;
  if (data && data.isSuccess && data.data && data.data.isSuccess && data.data.data) {
    result = data.data.data
  }
  return result || undefined
}

const videosOverAllAnalytics = async (token) => {
  let payload = {}
  let options = {
    method: 'GET',
    url: streamingEndpoints.GET_OVERALL_ANALYTICS,
    headers: {
      Authorization: token
    }
  }

  let data = await streamingUtils(payload, options)
  let result;
  if (data && data.isSuccess && data.data && data.data.isSuccess && data.data.data) {
    result = data.data.data
  }
  console.log(data)
  return result || undefined
}

var dateHandler = function (date) {

  dt1 = new Date(date.getFullYear(), date.getMonth(), 1);
  dt2 = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  dt4 = new Date(date.getFullYear(), date.getMonth(), 0);
  dt3 = new Date(date.getFullYear(), date.getMonth() - 1, 1);

  let currDate = {
    startDate: dt1,
    endDate: dt2
  }
  let prevDate = {
    startDate: dt3,
    endDate: dt4
  }
  let topDate = {
    startDate: dt3,
    endDate: dt2
  }
  return {
    currDate,
    prevDate,
    topDate
  }

}



const revenue = async (query) => {
  let abondonedQuery = { ...query }
  const [result, abandoned, order] = await Promise.all([
    originRevenue(query),
    abondonedCart(abondonedQuery),
    totalOrders(query)
  ]);
  if (result.length > 0) {
    result[0].abandonedCart = abandoned;
    result[0].order = order
  }
  return result;
};

const Payroll = require('../payroll/payroll.model');
const TeacherAttendance = require('../payroll/teacherAttendance.model');
const Attendance = require('../attendance/attendance.model');
const Branch = require('../branch/branch.model');
const Grade = require('../grade/grade.model');
const School = require('../school/school.model');

/**
 * Get analytics data based on user role
 * @param {string} role - User role (teacher, admin, superadmin)
 * @param {Object} filter - Additional filters (schoolId, branchId, teacherId, etc.)
 * @returns {Promise<Object>}
 */
const getAnalytics = async (role, filter) => {
  if (!role) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Role is required');
  }
  switch (role) {
    case 'platformAdmin':
    case 'rootUser':
      if (filter.schoolId) {
        return getSchoolAnalytics(filter);
      }
      return getPlatformAnalytics(filter);
    case 'superadmin':
      // Superadmin sees all analytics except root/superadmin users
      return getSuperAdminAnalytics(filter);
    case 'admin':
      // Admin only sees their own school's analytics
      if (!filter.schoolId) throw new ApiError(httpStatus.BAD_REQUEST, 'schoolId is required for admin analytics');
      return getSchoolAnalytics(filter);
    case 'teacher':
      return getTeacherAnalytics(filter);
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid role');
  }
};

/**
 * Platform-wide analytics for root (all schools). Optional schoolId narrows to one school via getSchoolAnalytics.
 */
const getPlatformAnalytics = async (filter) => {
  const { from, to } = filter;

  let dateFilter = {};
  if (from || to) {
    dateFilter.createdAt = {};
    if (from) dateFilter.createdAt.$gte = new Date(from);
    if (to) dateFilter.createdAt.$lte = new Date(to);
  }

  const safeCount = (v) => (typeof v === 'number' && !isNaN(v) ? v : 0);

  const userBase = {
    schoolId: { $exists: true, $ne: null },
    role: { $in: ['admin', 'superadmin', 'teacher', 'student'] },
  };

  const totalSchools = safeCount(await School.countDocuments({}));

  const totalUsers = safeCount(await User.countDocuments({ ...userBase, ...dateFilter }));
  const totalAdmins = safeCount(await User.countDocuments({ ...userBase, role: 'admin', ...dateFilter }));
  const totalSuperAdmins = safeCount(await User.countDocuments({ ...userBase, role: 'superadmin', ...dateFilter }));
  const totalTeachers = safeCount(await User.countDocuments({ ...userBase, role: 'teacher', ...dateFilter }));
  const totalStudents = safeCount(await User.countDocuments({ ...userBase, role: 'student', ...dateFilter }));

  const teacherAttBase = { school: { $exists: true, $ne: null } };
  const presentTeachers = safeCount(
    await TeacherAttendance.countDocuments({ ...teacherAttBase, status: 'present', ...dateFilter })
  );
  const absentTeachers = safeCount(
    await TeacherAttendance.countDocuments({ ...teacherAttBase, status: 'absent', ...dateFilter })
  );

  const attendanceUserBase = { schoolId: { $exists: true, $ne: null } };
  const presentStudents = safeCount(
    await Attendance.countDocuments({ ...attendanceUserBase, status: 'present', ...dateFilter })
  );
  const absentStudents = safeCount(
    await Attendance.countDocuments({ ...attendanceUserBase, status: 'absent', ...dateFilter })
  );

  const migratedStudents = safeCount(
    await User.countDocuments({ ...userBase, role: 'student', migration: true, ...dateFilter })
  );
  const unmigratedStudents = safeCount(
    await User.countDocuments({ ...userBase, role: 'student', migration: { $ne: true }, ...dateFilter })
  );

  const totalBranches = safeCount(await Branch.countDocuments({}));

  const studentCountBySchoolRaw = await User.aggregate([
    { $match: { ...userBase, role: 'student', ...dateFilter } },
    { $group: { _id: '$schoolId', studentCount: { $sum: 1 } } },
  ]);

  const schoolIds = studentCountBySchoolRaw.map((item) => item._id).filter(Boolean);
  const schools = schoolIds.length
    ? await School.find({ _id: { $in: schoolIds } }).lean()
    : [];
  const schoolNameMap = Object.fromEntries(schools.map((s) => [s._id.toString(), s.name || 'School']));

  const studentsByBranchChart = studentCountBySchoolRaw.map((item) => ({
    branchId: item._id?.toString() || 'unknown',
    branchName: schoolNameMap[item._id?.toString()] || 'Unknown school',
    studentCount: item.studentCount,
  }));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const attendanceTrendsBaseFilter = from ? dateFilter : { createdAt: { $gte: thirtyDaysAgo } };

  const studentAttendanceDailyRaw = await Attendance.aggregate([
    { $match: { ...attendanceUserBase, ...attendanceTrendsBaseFilter, status: 'present' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const teacherAttendanceDailyRaw = await TeacherAttendance.aggregate([
    { $match: { ...teacherAttBase, ...attendanceTrendsBaseFilter, status: 'present' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const trendsMap = {};
  studentAttendanceDailyRaw.forEach((item) => {
    trendsMap[item._id] = { date: item._id, presentStudents: item.count, presentTeachers: 0 };
  });
  teacherAttendanceDailyRaw.forEach((item) => {
    if (!trendsMap[item._id]) {
      trendsMap[item._id] = { date: item._id, presentStudents: 0, presentTeachers: 0 };
    }
    trendsMap[item._id].presentTeachers = item.count;
  });

  const attendanceTrends = Object.values(trendsMap).sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    scope: 'platform',
    totalSchools,
    totalUsers,
    totalAdmins,
    totalSuperAdmins,
    totalTeachers,
    totalStudents,
    presentTeachers,
    absentTeachers,
    presentStudents,
    absentStudents,
    migratedStudents,
    unmigratedStudents,
    totalBranches,
    gradesByBranch: {},
    attendanceTrends,
    studentsByBranchChart,
  };
};

const getSuperAdminAnalytics = async (filter) => {
  const totalTeachers = await User.countDocuments({ role: 'teacher' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  const totalPayrolls = await Payroll.countDocuments({});

  return {
    totalTeachers,
    totalAdmins,
    totalPayrolls,
    // ...other analytics
  };
};

// Example analytics for admin

const getSchoolAnalytics = async (filter) => {
  const { schoolId, branchId, from, to } = filter;
  // Always use ObjectId for lookups
  const schoolObjId = typeof schoolId === 'string' ? mongoose.Types.ObjectId(schoolId) : schoolId;
  const branchObjId = branchId ? (typeof branchId === 'string' ? mongoose.Types.ObjectId(branchId) : branchId) : undefined;

  // Date filter
  let dateFilter = {};
  if (from || to) {
    dateFilter.createdAt = {};
    if (from) dateFilter.createdAt.$gte = new Date(from);
    if (to) dateFilter.createdAt.$lte = new Date(to);
  }

  // User role filters
  const userBase = { schoolId: schoolObjId };
  if (branchObjId) userBase.branchId = branchObjId;

  // Helper to ensure a number is always returned
  const safeCount = v => typeof v === 'number' && !isNaN(v) ? v : 0;

  // Total users (excluding root/superadmin)
  const totalUsers = safeCount(await User.countDocuments({ ...userBase, ...dateFilter }));
  // Total admins
  const totalAdmins = safeCount(await User.countDocuments({ ...userBase, role: 'admin', ...dateFilter }));
  // Total superadmins (should be 0 for school scope)
  const totalSuperAdmins = safeCount(await User.countDocuments({ ...userBase, role: 'superadmin', ...dateFilter }));
  // Total teachers
  const totalTeachers = safeCount(await User.countDocuments({ ...userBase, role: 'teacher', ...dateFilter }));
  // Total students
  const totalStudents = safeCount(await User.countDocuments({ ...userBase, role: 'student', ...dateFilter }));

  // Total present/absent teachers using TeacherAttendance
  // Ensure we query using the correct property name. In TeacherAttendance it's "school" not "schoolId". 
  const teacherAttBase = { school: schoolObjId };
  if (branchObjId) teacherAttBase.branch = branchObjId;
  const presentTeachers = safeCount(await TeacherAttendance.countDocuments({ ...teacherAttBase, status: 'present', ...dateFilter }));
  const absentTeachers = safeCount(await TeacherAttendance.countDocuments({ ...teacherAttBase, status: 'absent', ...dateFilter }));

  // Total present/absent students using Attendance
  const presentStudents = safeCount(await Attendance.countDocuments({ ...userBase, status: 'present', ...dateFilter }));
  const absentStudents = safeCount(await Attendance.countDocuments({ ...userBase, status: 'absent', ...dateFilter }));

  // Total migrated/unmigrated students (using 'migration' field)
  const migratedStudents = safeCount(await User.countDocuments({ ...userBase, role: 'student', migration: true, ...dateFilter }));
  const unmigratedStudents = safeCount(await User.countDocuments({ ...userBase, role: 'student', migration: { $ne: true }, ...dateFilter }));

  // Branches
  const branchQuery = { schoolId: schoolObjId };
  if (branchObjId) branchQuery._id = branchObjId;
  const allBranches = await Branch.find(branchQuery).lean();
  const totalBranches = safeCount(allBranches.length);
  const branchMap = {};
  allBranches.forEach(b => { branchMap[b._id.toString()] = b.name || b.branchCode || b._id.toString(); });

  // Grades in each branch and sections in each grade
  const gradeQuery = { schoolId: schoolObjId };
  if (branchObjId) gradeQuery.branchId = branchObjId;
  const grades = await Grade.find(gradeQuery).lean();
  const gradesByBranch = {};
  for (const grade of grades) {
    const branchKey = grade.branchId?.toString();
    let branchName = branchMap[branchKey];
    if (!branchName && branchKey) {
      // Fallback: fetch branch directly if not in branchMap
      const branchDoc = await Branch.findById(branchKey).lean();
      branchName = branchDoc?.name || branchDoc?.branchCode || 'Unknown Branch';
      branchMap[branchKey] = branchName;
      if (branchName === 'Unknown Branch') {
        console.warn(`[Analytics] Grade ${grade._id} references missing branchId: ${branchKey}`);
      }
    }
    if (!gradesByBranch[branchKey]) gradesByBranch[branchKey] = { branchName, grades: [] };
    gradesByBranch[branchKey].grades.push({
      gradeId: grade._id,
      gradeName: grade.title || grade.name || grade._id.toString(),
      sections: grade.sections || [],
    });
  }

  // --- Analytics Chart Trends ---

  // Create an array for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendanceTrendsBaseFilter = from ? dateFilter : { createdAt: { $gte: thirtyDaysAgo } };

  // Get daily student attendance
  const studentAttendanceDailyRaw = await Attendance.aggregate([
    { $match: { ...userBase, ...attendanceTrendsBaseFilter, status: 'present' } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // Get daily teacher attendance
  const teacherAttendanceDailyRaw = await TeacherAttendance.aggregate([
    { $match: { ...teacherAttBase, ...attendanceTrendsBaseFilter, status: 'present' } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // Merge the arrays into a formatted charting array
  // { date: "YYYY-MM-DD", presentStudents: 0, presentTeachers: 0 }
  const trendsMap = {};
  studentAttendanceDailyRaw.forEach(item => {
    trendsMap[item._id] = { date: item._id, presentStudents: item.count, presentTeachers: 0 };
  });
  teacherAttendanceDailyRaw.forEach(item => {
    if (!trendsMap[item._id]) {
      trendsMap[item._id] = { date: item._id, presentStudents: 0, presentTeachers: 0 };
    }
    trendsMap[item._id].presentTeachers = item.count;
  });

  const attendanceTrends = Object.values(trendsMap).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Branch statistics for pie charts
  const studentCountByBranchRaw = await User.aggregate([
    { $match: { ...userBase, role: 'student', ...dateFilter } },
    { $group: { _id: "$branchId", count: { $sum: 1 } } } // count per branch
  ]);

  const studentsByBranchChart = studentCountByBranchRaw.map(item => ({
    branchId: item._id?.toString() || 'unassigned',
    branchName: item._id ? branchMap[item._id.toString()] || 'Unknown' : 'Unassigned',
    studentCount: item.count
  }));

  // Always return all fields, even if zero
  return {
    totalUsers,
    totalAdmins,
    totalSuperAdmins,
    totalTeachers,
    totalStudents,
    presentTeachers,
    absentTeachers,
    presentStudents,
    absentStudents,
    migratedStudents,
    unmigratedStudents,
    totalBranches,
    gradesByBranch,
    attendanceTrends,
    studentsByBranchChart,
  };
};

// Example analytics for teacher
const getTeacherAnalytics = async (filter) => {
  const { teacherId } = filter;
  const attendanceCount = await TeacherAttendance.countDocuments({ teacher: teacherId });
  // Add more analytics as needed
  return {
    attendanceCount,
    // ...other analytics
  };
};

const monthlyAnalytics = async (date, token) => {
  const userAnalytics = await usersMonthlyAnalytics(date.prev, date.curr, date.top);
  const videoAnalytics = await videosMonthlyAnalytics(date, token);
  return {
    userAnalytics,
    videoAnalytics,
  };
};

const overallAnalytics = async (token) => {
  const videoAnalytics = await videosOverAllAnalytics(token);
  // Add other overall analytics as needed
  return {
    videoAnalytics,
  };
};

module.exports = {
  logEvent,
  monthlyAnalytics,
  overallAnalytics,
  orderChart,
  revenue,
  getAnalytics,
  getSchoolAnalytics,
  getPlatformAnalytics,
};

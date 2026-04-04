const httpStatus = require('http-status');
const TeacherAttendance = require('./teacherAttendance.model');
const ApiError = require('../../utils/ApiError');
const User = require('../user/user.model');

const createTeacherAttendance = async (teacherAttendanceBody) => {
  const teacherAttendance = await TeacherAttendance.create(teacherAttendanceBody);
  return teacherAttendance;
};

const queryTeacherAttendances = async (filter, options) => {
  const teacherAttendances = await TeacherAttendance.paginate(filter, options);
  return teacherAttendances;
};

const getTeacherAttendanceById = async (id) => {
  return TeacherAttendance.findById(id);
};

const updateTeacherAttendanceById = async (teacherAttendanceId, updateBody) => {
  const teacherAttendance = await getTeacherAttendanceById(teacherAttendanceId);
  if (!teacherAttendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Teacher attendance not found');
  }
  Object.assign(teacherAttendance, updateBody);
  await teacherAttendance.save();
  return teacherAttendance;
};

const deleteTeacherAttendanceById = async (teacherAttendanceId) => {
  const teacherAttendance = await getTeacherAttendanceById(teacherAttendanceId);
  if (!teacherAttendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Teacher attendance not found');
  }
  await teacherAttendance.remove();
  return teacherAttendance;
};

const createBulkTeacherAttendances = async (attendanceEntriesArray, markedByUserId) => {
  const results = {
    success: [],
    errors: [],
  };

  for (const entry of attendanceEntriesArray) {
    try {
      const attendancePayload = {
        teacher: entry.teacherId,
        school: entry.schoolId,
        branch: entry.branchId,
        date: entry.date,
        status: entry.status,
        leaveType: entry.leaveType || undefined,
        remarks: entry.remarks,
        markedBy: markedByUserId,
      };

      const attendance = await TeacherAttendance.findOneAndUpdate(
        { teacher: entry.teacherId, date: entry.date },
        { $set: attendancePayload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      results.success.push(attendance);
    } catch (error) {
      results.errors.push({ entry, error: 'An unexpected error occurred processing this entry.' });
    }
  }
  return results;
};


const getUnmarkedTeachers = async (schoolId, branchId, date) => {
  const queryDate = new Date(date);
  const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

  const markedTeachers = await TeacherAttendance.find({
    branch: branchId,
    date: { $gte: startOfDay, $lte: endOfDay },
  }).select('teacher');

  const markedTeacherIds = markedTeachers.map((att) => att.teacher);

  const unmarkedTeachers = await User.find({
    branchId,
    role: 'teacher',
    _id: { $nin: markedTeacherIds },
  });

  return unmarkedTeachers;
};

module.exports = {
  createTeacherAttendance,
  queryTeacherAttendances,
  getTeacherAttendanceById,
  updateTeacherAttendanceById,
  deleteTeacherAttendanceById,
  createBulkTeacherAttendances,
  getUnmarkedTeachers,
};

const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const teacherAttendanceSchema = mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave', 'sick_leave', 'half_day_leave'],
      required: true,
    },
    // optional explicit leave type name (from LeavePolicy.leaveTypes[].name)
    leaveType: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
teacherAttendanceSchema.plugin(toJSON);
teacherAttendanceSchema.plugin(paginate);

teacherAttendanceSchema.index({ teacher: 1, date: 1 }, { unique: true });

const TeacherAttendance =
  mongoose.models.TeacherAttendance || mongoose.model('TeacherAttendance', teacherAttendanceSchema);

module.exports = TeacherAttendance;

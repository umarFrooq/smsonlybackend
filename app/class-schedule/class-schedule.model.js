const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose'); // Assuming utils/mongoose for plugins

const classScheduleSchema = mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: true,
    },
    section: {
      type: String,
      trim: true,
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming User model for teachers
      required: true,
    },
    dayOfWeek: { // e.g., "Monday", "Tuesday" or 0-6
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: { // Store as HH:mm string or minutes from start of day
      type: String, // e.g., "09:00"
      required: true,
    },
    endTime: { // e.g., "10:00"
      type: String,
      required: true,
    },
    // Optional: for specific one-time schedules or overriding recurring ones.
    // specificDate: {
    //   type: Date,
    // },
    // isActive: {
    //   type: Boolean,
    //   default: true,
    // },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins that convert mongoose model to JSON and enable pagination
classScheduleSchema.plugin(toJSON);
classScheduleSchema.plugin(paginate);

// Add a compound unique index to prevent duplicate schedules for the same teacher, time, and day
// This might need adjustment based on specific business rules (e.g., teacher can teach two different grades/subjects at same time if in different rooms/virtual)
// For now, a simple one: one teacher, one class at a specific time slot on a specific day.
classScheduleSchema.index({ schoolId: 1, branchId: 1, gradeId: 1, section: 1, subjectId: 1, dayOfWeek: 1, startTime: 1 }, { unique: true, name: 'unique_class_schedule_slot' });
classScheduleSchema.index({ teacherId: 1, dayOfWeek: 1, startTime: 1 }, { unique: true, name: 'unique_teacher_timeslot' });


/**
 * @typedef ClassSchedule
 */
const ClassSchedule = mongoose.model('ClassSchedule', classScheduleSchema);

module.exports = ClassSchedule;

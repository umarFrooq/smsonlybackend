const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schoolId: { // Added schoolId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    gradeId: { // The grade (class level) the student is in for this subject's session
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      required: true,
    },
    section: { // The specific section of the grade, e.g., "A", "B", "MORNING"
      type: String,
      trim: true,
      uppercase: true,
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["present", "absent", "leave", "sick_leave", "half_day_leave"],
    },
    remarks: {
      type: String,
      trim: true,
    },
    markedBy: { // User who marked this attendance (e.g., a teacher or staff)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
attendanceSchema.plugin(toJSON);
attendanceSchema.plugin(paginate);

// Compound unique index to prevent duplicate attendance entries
attendanceSchema.index(
  { studentId: 1, subjectId: 1, date: 1, gradeId: 1, section: 1 },
  { unique: true, message: "Attendance record for this student, subject, grade, section and date already exists." }
);


const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;

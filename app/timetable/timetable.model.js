const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist

const scheduleEntrySchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  periodNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  startTime: { // HH:MM format
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format (e.g., 09:00).'],
  },
  endTime: {   // HH:MM format
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format (e.g., 10:00).'],
    validate: [
        function(value) {
            // Basic validation: endTime > startTime (lexicographical comparison is fine for HH:MM)
            return this.startTime && value > this.startTime;
        },
        'End time must be after start time for the same period.'
    ]
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  teacherId: { // Teacher assigned to this specific period
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming User model has a 'teacher' role
  },
  roomId: { // Optional: Classroom or lab ID/name
    type: String,
    trim: true,
  },
}, { _id: false }); // No separate _id for subdocuments unless needed

const timetableSchema = new mongoose.Schema(
  {
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: true,
    },
    schoolId: { // Added schoolId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    effectiveDate: { // Date from which this timetable is active
      type: Date,
      default: Date.now,
    },
    isActive: { // Only one timetable per grade/section/branch should be active at a time
      type: Boolean,
      default: true,
    },
    schedule: [scheduleEntrySchema],
    // createdBy and updatedBy can be added if needed
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
timetableSchema.plugin(toJSON);
timetableSchema.plugin(paginate);

// Compound unique index
timetableSchema.index(
  { gradeId: 1, section: 1, branchId: 1, effectiveDate: 1 },
  { unique: true, message: 'A timetable for this grade, section, branch, and effective date already exists.' }
);
// Index for quickly finding active timetables
timetableSchema.index({ gradeId: 1, section: 1, branchId: 1, isActive: 1, effectiveDate: -1 });


const Timetable = mongoose.model("Timetable", timetableSchema);

module.exports = Timetable;

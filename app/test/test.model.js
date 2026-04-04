const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
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
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      required: true,
    },
    section: { // Optional: if for a specific section
      type: String,
      trim: true,
      uppercase: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    passingMarks: {
      type: Number,
      min: 0,
      validate: [
        function (value) {
          // Ensure passingMarks is not greater than totalMarks
          return value === undefined || value === null || this.totalMarks === undefined || value <= this.totalMarks;
        },
        'Passing marks cannot be greater than total marks.'
      ]
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: { // e.g., "10:00 AM"
      type: String,
      trim: true,
    },
    endTime: {   // e.g., "11:00 AM"
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
testSchema.plugin(toJSON);
testSchema.plugin(paginate);

const Test = mongoose.model("Test", testSchema);

module.exports = Test;

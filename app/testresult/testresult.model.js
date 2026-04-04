const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist

const testResultSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    schoolId: { // Added schoolId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gradeId: { // Denormalized for easier querying
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      required: true,
    },
    branchId: { // Denormalized
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    obtainedMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    totalMarksAtTimeOfTest: { // Denormalized from Test.totalMarks at the time of result creation
      type: Number,
      required: true,
      min: 0,
    },
    comments: {
      type: String,
      trim: true,
    },
    answerSheetImage: { // URL from S3
      type: String,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
testResultSchema.plugin(toJSON);
testResultSchema.plugin(paginate);

// Validator: obtainedMarks should not exceed totalMarksAtTimeOfTest
testResultSchema.path('obtainedMarks').validate(function (value) {
  return value <= this.totalMarksAtTimeOfTest;
}, 'Obtained marks ({VALUE}) cannot exceed total marks for the test ({PATH}).');


// Compound unique index
testResultSchema.index(
  { testId: 1, studentId: 1 },
  { unique: true, message: 'Result for this student and test already exists.' }
);

const TestResult = mongoose.model("TestResult", testResultSchema);

module.exports = TestResult;

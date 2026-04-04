const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist

const paperSchema = new mongoose.Schema(
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
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    year: { // e.g., "2023", "2022-2023"
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['past_paper', 'model_paper', 'template'],
      default: 'past_paper',
      required: true,
    },
    paperFileUrl: { // URL from S3
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
paperSchema.plugin(toJSON);
paperSchema.plugin(paginate);

const Paper = mongoose.model("Paper", paperSchema);

module.exports = Paper;

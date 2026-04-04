const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose");

const subjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      // unique: true, // Uniqueness will be handled by compound index with schoolId
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    creditHours: {
      type: Number,
      required: true,
      min: 0,
    },
    schoolId: { // Added schoolId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    defaultTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // We'll need to ensure this user has the 'teacher' role at the service level
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      // required: true, // Making it optional for now, can be made required based on product decision
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
subjectSchema.plugin(toJSON);
subjectSchema.plugin(paginate);

// Compound index for schoolId and subjectCode to ensure subjectCode is unique within a school
subjectSchema.index({ schoolId: 1, subjectCode: 1 }, { unique: true });

/**
 * Check if subjectCode is taken within a specific school
 * @param {string} subjectCode - The subject's code
 * @param {ObjectId} schoolId - The ID of the school
 * @param {ObjectId} [excludeSubjectId] - The ID of the subject to be excluded (e.g., when updating)
 * @returns {Promise<boolean>}
 */
subjectSchema.statics.isSubjectCodeTakenInSchool = async function (subjectCode, schoolId, excludeSubjectId) {
  const query = { subjectCode, schoolId };
  if (excludeSubjectId) {
    query._id = { $ne: excludeSubjectId };
  }
  const subject = await this.findOne(query);
  return !!subject;
};

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;

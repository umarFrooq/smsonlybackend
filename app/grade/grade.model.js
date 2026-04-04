const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist
const autopopulate = require("mongoose-autopopulate");

const gradeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    levelCode: { // Optional code for the grade/level, e.g., "GR1", "GR2-ADV"
      type: String,
      // unique: true, // Uniqueness will be handled by compound index with schoolId
      sparse: true, // Allows multiple documents to have null for this field if not provided
      trim: true,
      // Making it required if a school wants to use level codes for uniqueness.
      // If not all schools use it, sparse:true is fine, but uniqueness check needs to handle nulls.
      // For simplicity, let's assume if levelCode is provided, it should be unique within the school.
      // If it's optional, the unique index might behave differently with nulls.
      // For now, we'll make it not strictly required in schema but check in service if provided.
    },
    description: {
      type: String,
      trim: true,
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
      autopopulate: { select: 'name branchCode' }, // Autopopulate branch name and code
    },
    sections: [
      {
        type: String,
        trim: true,
        uppercase: true, // Store section names in uppercase, e.g., "A", "B", "MORNING"
      },
    ],
    nextGradeId: { // For defining a sequence of grades, e.g., Grade 1 -> Grade 2
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade", // Self-reference to another Grade document
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
gradeSchema.plugin(toJSON);
gradeSchema.plugin(paginate);
gradeSchema.plugin(autopopulate);

// Compound index for schoolId and levelCode to ensure levelCode is unique within a school (if levelCode is provided)
// Sparse index on levelCode alone might be needed if many grades don't have a levelCode but those that do must be unique globally (less likely for this field)
// For levelCode unique within a school:
gradeSchema.index({ schoolId: 1, levelCode: 1 }, { unique: true, sparse: true }); // sparse:true allows multiple nulls for levelCode within a school

/**
 * Check if levelCode is taken within a specific school
 * @param {string} levelCode - The grade's level code
 * @param {ObjectId} schoolId - The ID of the school
 * @param {ObjectId} [excludeGradeId] - The ID of the grade to be excluded (e.g., when updating)
 * @returns {Promise<boolean>}
 */
gradeSchema.statics.isLevelCodeTakenInSchool = async function (levelCode, schoolId, excludeGradeId) {
  if (!levelCode) return false; // If levelCode is not provided, it's not "taken"
  const query = { levelCode, schoolId };
  if (excludeGradeId) {
    query._id = { $ne: excludeGradeId };
  }
  const grade = await this.findOne(query);
  return !!grade;
};

const Grade = mongoose.model("Grade", gradeSchema);

module.exports = Grade;

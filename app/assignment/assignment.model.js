const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist
const autopopulate = require("mongoose-autopopulate");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      autopopulate: { select: 'title subjectCode' }, // Autopopulate subject title and subjectCode
    },
    teacherId: { // The user ID of the teacher who created the assignment
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      autopopulate: { select: 'firstName lastName email' }, // Autopopulate teacher details
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      required: true,
      autopopulate: { select: 'title levelCode' }, // Autopopulate grade title and level code
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      autopopulate: { select: 'name branchCode' }, // Autopopulate branch name and code
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    lateSubmissionPenaltyPercentage: { // Optional: Penalty percentage if late submission is allowed
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      validate: {
        validator: function(v) {
          // This validator is only relevant if allowLateSubmission is true
          return !this.allowLateSubmission || (this.allowLateSubmission && v >= 0 && v <= 100);
        },
        message: 'Penalty percentage must be between 0 and 100 if late submissions are allowed.'
      }
    },
    fileAttachments: [ // Optional files attached by the teacher for the assignment
      {
        fileName: String,
        filePath: String, // URL or path to the file
        fileType: String,
      }
    ],
    status: { // e.g., 'draft', 'published', 'archived'
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published',
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
assignmentSchema.plugin(toJSON);
assignmentSchema.plugin(paginate);
assignmentSchema.plugin(autopopulate);

// Indexes
assignmentSchema.index({ schoolId: 1, gradeId: 1, subjectId: 1 });
assignmentSchema.index({ teacherId: 1 });
assignmentSchema.index({ dueDate: 1 });

/**
 * Check if an assignment with the same title already exists for the same teacher, subject, and grade.
 * This is a basic example; uniqueness constraints can be more complex.
 * @param {string} title - The assignment's title
 * @param {ObjectId} teacherId - The ID of the teacher
 * @param {ObjectId} subjectId - The ID of the subject
 * @param {ObjectId} gradeId - The ID of the grade
 * @param {ObjectId} [excludeAssignmentId] - The ID of the assignment to be excluded (e.g., when updating)
 * @returns {Promise<boolean>}
 */
assignmentSchema.statics.isTitleTaken = async function (title, teacherId, subjectId, gradeId, excludeAssignmentId) {
  const query = { title, teacherId, subjectId, gradeId };
  if (excludeAssignmentId) {
    query._id = { $ne: excludeAssignmentId };
  }
  const assignment = await this.findOne(query);
  return !!assignment;
};

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;

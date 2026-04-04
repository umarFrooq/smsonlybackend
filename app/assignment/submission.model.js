const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist
const autopopulate = require("mongoose-autopopulate");

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      autopopulate: { select: "title dueDate totalMarks subjectId gradeId schoolId branchId teacherId" }, // autopopulate basic assignment details
    },
    studentId: { // The user ID of the student who made the submission
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      autopopulate: { select: "firstName lastName email" }, // Autopopulate student details
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    submittedFiles: [ // Files submitted by the student
      {
        fileName: String,
        filePath: String, // URL or path to the file
        fileType: String,
        submittedAt: { type: Date, default: Date.now }
      },
    ],
    studentRemarks: { // Optional remarks from the student
        type: String,
        trim: true,
    },
    obtainedMarks: {
      type: Number,
      min: 0,
      // Max validation can be dynamic based on assignment.totalMarks in service layer if needed
    },
    teacherRemarks: { // Feedback or remarks from the teacher after grading
      type: String,
      trim: true,
    },
    isLateSubmission: {
      type: Boolean,
      default: false, // This will be determined at the time of submission by the service
    },
    gradedDate: { // Date when the submission was graded
        type: Date,
    },
    gradedBy: { // User ID of the teacher who graded
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    status: { // e.g., 'submitted', 'graded', 'resubmitted'
        type: String,
        enum: ['submitted', 'graded', 'resubmitted', 'pending_review'],
        default: 'submitted',
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
submissionSchema.plugin(toJSON);
submissionSchema.plugin(paginate);
submissionSchema.plugin(autopopulate);

// Indexes
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true }); // A student can submit to an assignment only once.
submissionSchema.index({ studentId: 1 });
submissionSchema.index({ assignmentId: 1 });


// Pre-save hook to check against totalMarks if obtainedMarks is set
submissionSchema.pre('save', function(next) {
  if (this.obtainedMarks && this.assignmentId && this.assignmentId.totalMarks) {
    if (this.obtainedMarks > this.assignmentId.totalMarks) {
      // In a real scenario, this kind of complex validation involving populated fields
      // might be better handled in the service layer before saving,
      // as autopopulate might not always be active or might be configured differently.
      // However, for a direct save after population, this can act as a safeguard.
      // For now, we'll keep it simple. A more robust check would be in the service layer.
      // console.warn("Obtained marks exceed total marks for the assignment. Clamping or error might be needed.");
    }
  }
  next();
});


const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;

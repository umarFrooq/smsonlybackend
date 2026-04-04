const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const resultSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
      schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: false,
      },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
        required: true,
    },
      gradeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: false,
      },
      branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: false,
      },
    marksObtained: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    grade: {
      type: String,
      trim: true,
    },
    // Pass/Fail status entered by teacher/admin/superadmin
    passStatus: {
      type: String,
      enum: ['pass', 'fail'],
      required: false,
    },
    remarks: {
      type: String,
      trim: true,
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'announced'],
        default: 'draft',
    },
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

// Add plugins that convert Mongoose to JSON
resultSchema.plugin(toJSON);
resultSchema.plugin(paginate);

// Prevent duplicate results for same exam/subject/student within a school
resultSchema.index({ schoolId: 1, examId: 1, subjectId: 1, studentId: 1 }, { unique: true, name: 'unique_result_per_student_subject_exam' });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;

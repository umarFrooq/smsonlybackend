const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    // Support multiple grades or all grades
    gradeIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
    }],
    allGrades: {
      type: Boolean,
      default: false,
    },
    session: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional date for the exam (e.g., exam start date)
    date: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'announced'],
      default: 'scheduled',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins that convert Mongoose to JSON
examSchema.plugin(toJSON);
examSchema.plugin(paginate);

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;

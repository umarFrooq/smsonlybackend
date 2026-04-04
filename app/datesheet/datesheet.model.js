const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const datesheetSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    // either a subject reference or a free-text subject title
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    subject: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'announced', 'cancelled'],
      default: 'draft',
    },
      schoolId: { // Added schoolId
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
      },
  },
  {
    timestamps: true,
  }
);

// Add plugins that convert Mongoose to JSON
datesheetSchema.plugin(toJSON);
datesheetSchema.plugin(paginate);

const DateSheet = mongoose.model('DateSheet', datesheetSchema);

module.exports = DateSheet;

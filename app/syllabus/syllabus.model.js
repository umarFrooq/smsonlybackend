const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const syllabusItemSchema = mongoose.Schema(
  {
    month: { type: Number, min: 1, max: 12 },
    startDate: { type: Date },
    endDate: { type: Date },
    chapters: [{ type: String }],
    targetNotes: { type: String },
  },
  { _id: false }
);

const syllabusSchema = mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    title: { type: String, trim: true },
    year: { type: Number },
    items: [syllabusItemSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

syllabusSchema.plugin(toJSON);
syllabusSchema.plugin(paginate);

syllabusSchema.index({ schoolId: 1, gradeId: 1, subjectId: 1, year: 1 });

const Syllabus = mongoose.model('Syllabus', syllabusSchema);
module.exports = Syllabus;

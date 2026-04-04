const mongoose = require('mongoose');
const { toJSON, paginate } = require("../../utils/mongoose");

const salarySchema = mongoose.Schema(
  {
    teacherId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    schoolId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'School',
        required: true,
    },
    branchId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Branch',
        required: true,
    },
    basic: {
      type: Number,
      required: true,
    },
    allowances: [
      {
        title: { type: String },
        amount: { type: Number, default: 0 },
        description: { type: String, trim: true },
      },
    ],
    deductions: [
      {
        title: { type: String },
        amount: { type: Number, default: 0 },
        description: { type: String, trim: true },
      },
    ],
    bonuses: [
      {
        title: { type: String },
        amount: { type: Number, default: 0 },
        description: { type: String, trim: true },
      },
    ],
    net: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
salarySchema.plugin(toJSON);
salarySchema.plugin(paginate);

/**
 * @typedef Salary
 */
const Salary = mongoose.model('Salary', salarySchema);

module.exports = Salary;

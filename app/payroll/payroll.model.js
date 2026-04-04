const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const payrollSchema = mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    bonuses: {
      type: Number,
      default: 0,
    },
    // detailed bonus entries with reason and optional title
    bonusItems: {
      type: [
        {
          title: { type: String },
          amount: { type: Number, default: 0 },
          reason: { type: String },
        },
      ],
      default: [],
    },
    allowances: {
      type: Number,
      default: 0,
    },
    // detailed allowance entries with reason and optional title
    allowanceItems: {
      type: [
        {
          title: { type: String },
          amount: { type: Number, default: 0 },
          reason: { type: String },
        },
      ],
      default: [],
    },
    deductions: {
      type: Number,
      default: 0,
    },
    // detailed deduction entries with reason and optional title
    deductionItems: {
      type: [
        {
          title: { type: String },
          amount: { type: Number, default: 0 },
          reason: { type: String },
        },
      ],
      default: [],
    },
    // breakdown of leaves used in this payroll month
    leaveUsage: {
      type: [
        {
          leaveType: { type: String }, // name or id
          used: { type: Number, default: 0 },
          allowed: { type: Number, default: 0 },
          excess: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    // deductions applied because of leaves (or related reasons)
    leaveDeductions: {
      type: [
        {
          leaveType: { type: String },
          amount: { type: Number, default: 0 },
          reason: { type: String },
        },
      ],
      default: [],
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Paid', 'Unpaid'],
      default: 'Unpaid',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
payrollSchema.plugin(toJSON);
payrollSchema.plugin(paginate);

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;

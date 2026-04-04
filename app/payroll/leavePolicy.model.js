const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const leavePolicySchema = mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      // branch removed: leave policy applies to whole school, not per-branch
    },
    // support multiple leave types, e.g. [{ name: 'Sick', leavesPerMonth: 2, paid: true }]
    leaveTypes: [
      {
        name: {
          type: String,
          required: true,
        },
        leavesPerMonth: {
          type: Number,
          required: true,
          default: 0,
        },
        paid: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
leavePolicySchema.plugin(toJSON);
leavePolicySchema.plugin(paginate);

// ensure one policy per school (applies to all branches)
leavePolicySchema.index({ school: 1 }, { unique: true });

const LeavePolicy = mongoose.model('LeavePolicy', leavePolicySchema);

module.exports = LeavePolicy;

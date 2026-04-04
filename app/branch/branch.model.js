const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose");
const autopopulate = require("mongoose-autopopulate");

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // required: true,
      trim: true,
    },
    address: {
      type: Object,
      // required: true,
   
    },
    branchCode: {
      type: String,
      // unique: true, // Uniqueness will be handled by compound index with schoolId
      sparse: true, // Still useful if branchCode is optional
      trim: true,
      required: true, // Making it required for the compound index to work effectively
    },
    schoolId: { // Added schoolId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'], // Define possible status values
      default: 'active',
      required: true,
    },
    type: {
      type: String,
      enum: ['main', 'sub'], // Using corrected "main" and "sub"
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
branchSchema.plugin(toJSON);
branchSchema.plugin(paginate);
branchSchema.plugin(autopopulate);

// Compound index for schoolId and branchCode to ensure branchCode is unique within a school
branchSchema.index({ schoolId: 1, branchCode: 1 }, { unique: true });

/**
 * Check if branchCode is taken within a specific school
 * @param {string} branchCode - The branch's code
 * @param {ObjectId} schoolId - The ID of the school
 * @param {ObjectId} [excludeBranchId] - The ID of the branch to be excluded (e.g., when updating)
 * @returns {Promise<boolean>}
 */
branchSchema.statics.isBranchCodeTakenInSchool = async function (branchCode, schoolId, excludeBranchId) {
  const query = { branchCode, schoolId };
  if (excludeBranchId) {
    query._id = { $ne: excludeBranchId };
  }
  const branch = await this.findOne(query);
  return !!branch;
};

const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;

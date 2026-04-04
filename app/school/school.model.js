const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose'); // Adjust path if necessary based on final structure

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
      default: '', // URL to logo image
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins that convert Mongoose to JSON
schoolSchema.plugin(toJSON);
schoolSchema.plugin(paginate);

/**
 * Check if school name is taken
 * @param {string} name - The school's name
 * @param {ObjectId} [excludeSchoolId] - The id of the school to be excluded
 * @returns {Promise<boolean>}
 */
schoolSchema.statics.isNameTaken = async function (name, excludeSchoolId) {
  const school = await this.findOne({ name, _id: { $ne: excludeSchoolId } });
  return !!school;
};

const School = mongoose.model('School', schoolSchema);

module.exports = School;

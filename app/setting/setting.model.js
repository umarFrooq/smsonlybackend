const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const autopopulate = require("mongoose-autopopulate");
const { dataTypes,settingCategory} = require("../../config/enums");

const settingSchema = new Schema(
  {
    key: { type: String, unique: true },
    keyValue: { type: String },
    active: { type: Boolean, default: true },
    label: { type: String },
    description: { type: String },
    unit: { type: String },
    dataType: { type: String, enums: { ...Object.values(dataTypes) }, default: dataTypes.STRING },
    category:{ type: String,default: settingCategory.GENERAL,enums: { ...Object.values(settingCategory) }}
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);
settingSchema.statics.isExistKey = async function (key) {

  const user = await this.findOne(key);
  return !!user;
};
settingSchema.plugin(autopopulate);
settingSchema.plugin(toJSON);
settingSchema.plugin(paginate);

// Create a model
const setting = mongoose.model("setting", settingSchema);

// Export the model
module.exports = setting;

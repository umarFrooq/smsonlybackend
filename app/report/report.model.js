const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {
  reportTypes,
  reportRefTypes,
  reportActions,
} = require("../../config/enums");
const { toJSON, paginate } = require("../../utils/mongoose");

const repSchema = new Schema(
  {
    type: {
      type: String,
      // required: true,
      enums: { ...Object.keys(reportTypes) },
    },
    typeId: { type: Schema.Types.ObjectId, required: true },
    comment: { type: String, trim: true, minlength: 1, maxlenth: 300 },
    userId: { type: Schema.Types.ObjectId, ref: "User"},
    mainRef: { type: mongoose.Types.ObjectId },
    mainRefType: { type: String, enums: { ...Object.keys(reportRefTypes) } },
    action: {
      type: String,
      enums: { ...Object.keys(reportActions) },
      default: reportActions.PENDING,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

repSchema.plugin(toJSON);
repSchema.plugin(paginate);
module.exports = mongoose.model("report", repSchema);

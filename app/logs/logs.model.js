const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");

const logSchema = new Schema({
    logFile: { type: String },
    type: { type: String },
    message: { type: String },
    // month: { type: String },
},{
    timestamps: true,
    toJSON: { virtuals: true }
  })

// followSchema.plugin(toJSON);
const Log = mongoose.model("Log", logSchema);
module.exports = Log;
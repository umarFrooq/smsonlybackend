const { toJSON, paginate } = require("../../utils/mongoose");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let visitSchema = new Schema({
    type: { type: String },
    visitorIp: { type: String },
    pageId: { type: String },
}, {
    timestamps: true,
})

visitSchema.plugin(toJSON);
visitSchema.plugin(paginate);
const Visit = mongoose.model('Visit', visitSchema)
module.exports = Visit
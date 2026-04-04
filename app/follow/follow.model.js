const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");

const followSchema = new Schema({
    followed: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true },
    follower: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true },
},{timestamps:true});

followSchema.plugin(toJSON);
followSchema.plugin(paginate);
followSchema.plugin(autopopulate);
const Follow = mongoose.model("Follow", followSchema);
module.exports = Follow;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");


const rrpSchema = new Schema({
  rrp: { type: String },
  rrpAmount: { type: Number },
  rrpCredit: { type: Number, default: 0 },
  // orderDetail: { type: Schema.Types.ObjectId, ref: "OrderDetail" },
  order: { type: Schema.Types.ObjectId, ref: "Order" },
  seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sellerDetail: { type: Schema.Types.ObjectId, ref: "SellerDetail", required: true },
  creditBack: { type: Boolean, default: false },
  customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
})

rrpSchema.plugin(toJSON);
rrpSchema.plugin(paginate);

const rrp = mongoose.model("rrp", rrpSchema);
module.exports = rrp;
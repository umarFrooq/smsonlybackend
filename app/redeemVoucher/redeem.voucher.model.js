const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const autopopulate = require("mongoose-autopopulate");
const { couponTypes } = require("../../config/enums");

const redeemVoucherSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  voucherId: { type: Schema.Types.ObjectId, ref: "Voucher", required: true },
  amount: { type: Number, required: true },
  couponType: { type: String, enums: { ...Object.values(couponTypes) } },
  typeId: { type: mongoose.Types.ObjectId },
  orderId: { type: mongoose.Types.ObjectId },
  quantity: { type: Number, default: 1 }

}, { timestamps: true, virutals: true });


// add plugin that converts mongoose to json
redeemVoucherSchema.plugin(autopopulate);
redeemVoucherSchema.plugin(toJSON);
redeemVoucherSchema.plugin(paginate);

const RedeemVoucher = mongoose.model("RedeemVoucher", redeemVoucherSchema);

// Export the model
module.exports = RedeemVoucher;
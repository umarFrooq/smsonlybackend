const { slugGenerator } = require("../../config/components/general.methods");
const { voucherStatuses, voucherTypes, couponTypes, adminDiscountTypes } = require("../../config/enums");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const autopopulate = require("mongoose-autopopulate");

const voucherSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: null },
  voucher: { type: String, unique: true },
  startDate: { type: Date },
  endDate: { type: Date },
  amount: { type: Number, required: true },
  status: {
    type: String, default: voucherStatuses.SCHEDULED,
    enum: { ...Object.values(voucherStatuses) }
  },
  discountType: { type: String, enums: { ...Object.values(adminDiscountTypes) }, default: adminDiscountTypes.AMOUNT },
  type: { type: String, enums: { ...Object.values(voucherTypes) }, default: voucherTypes.VOUCHER },
  couponType: { type: String, enums: { ...Object.values(couponTypes) } },
  couponTypeId: { type: mongoose.Types.ObjectId },
  numOfVouchers: { type: Number },
  limit: { type: Number },
  quantity: { type: Number },
  remainingVoucher: { type: Number },
  lang:{type:Object}

}, { timestamps: true, toJSON: { virtuals: true } });

// Pre save hook
voucherSchema.pre("save", async function (next) {
  const voucher = this;
  if (voucher.isNew) {

    if (voucher && voucher.type === voucherTypes.VOUCHER && !voucher.numOfVouchers)
      voucher.numOfVouchers = 1;
    // voucher generation
    // if (!voucher.voucher)
    if (voucher.voucher)
      voucher.voucher = voucher.voucher.split(" ").join("").toUpperCase();
    if (!voucher.voucher)
      voucher.voucher = slugGenerator("", 6);
    // if start date is not provided then set it to current date and status will get update to active
    if (!voucher.startDate) {
      voucher.startDate = new Date();
      voucher.status = voucherStatuses.ACTIVE;
    }
    if (voucher.quantity)
      voucher.remainingVoucher = voucher.quantity;
    // if (!voucher.remainingVoucher)
    next();
  }
  next();
});


// add plugin that converts mongoose to json
voucherSchema.plugin(autopopulate);
voucherSchema.plugin(toJSON);
voucherSchema.plugin(paginate);

const Voucher = mongoose.model("Voucher", voucherSchema);

// Export the model
module.exports = Voucher;
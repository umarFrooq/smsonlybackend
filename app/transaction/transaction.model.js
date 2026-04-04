const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const autopopulate = require("mongoose-autopopulate");
const { paymentMethods, transactionTypes, addOnTypes, transactionGeneratedFor } = require("../../config/enums");
const { payment } = require("../../config/config");
const { slugGenerator } = require("../../config/components/general.methods");

const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  amount: { type: Number, required: true },
  method: { type: String, default: paymentMethods.WALLET, enum: Object.values(paymentMethods) },
  type: { type: String, dafault: transactionTypes.DEBIT, enum: Object.values(transactionTypes) },
  description: { type: String, default: null },
  paymentGateway: { type: String },
  orderId: { type: Schema.Types.ObjectId, ref: "Order" },
  payId: { type: String },
  addOnType: { type: String, enum: Object.values(addOnTypes) },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User' },
  sellerDetailId: { type: Schema.Types.ObjectId, ref: 'SellerDetail' },
  transactionId: { type: String },
  orderDetailId: { type: Schema.Types.ObjectId, ref: "OrderDetail" },
  adjusttedShipment: { type: Number },
  premiumAmount: { type: Number },
  vat: { type: Number },
  forex: { type: Number },
  basePrice: { type: Number },
  commission: { type: Number },
  shippmentCharges: { type: Number },
  images: [String],
  subTotal: { type: Number },
  adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  admin: {
    fullname: String,
    email: String,
  },
  basePrice: Number,
  quantity: Number,
  orderNumber:String
}, { timestamps: true, virtaul: true });

transactionSchema.pre("save", async function (next) {
  const transaction = this;
  transaction.transactionId = slugGenerator(null, 20);
  next()

})

transactionSchema.pre("insertMany", async function (next, docs) {

  if (Array.isArray(docs) && docs.length) {
    for (let i = 0; i < docs.length; i++) {
      const transaction = docs[i];
      transaction.transactionId = slugGenerator(null, 20);
    }
  }
  next()
})
const voucher = this;
// add plugin that converts mongoose to json
transactionSchema.plugin(autopopulate);
transactionSchema.plugin(toJSON);
transactionSchema.plugin(paginate);

const Transaction = mongoose.model("transaction", transactionSchema);

// Export the model
module.exports = Transaction;
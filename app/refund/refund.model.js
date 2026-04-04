const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const autopopulate = require("mongoose-autopopulate");
const { paymentMethods, refundStatuses, refundTypes, refundMethod } = require("../../config/enums");
const refundSchema = new Schema({
  orderDetailId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderDetail', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  refundAmount: { type: Number, required: true },
  refundTotalAmount: { type: Number, required: true },
  refundedAmount: { type: Number },
  refundShippment: { type: Number, required: true },
  refundReason: { type: String, required: true },
  refundStatus: {
    type: String, default: refundStatuses.REQUESTED,
    enum: [refundStatuses.REQUESTED,
    refundStatuses.APPROVED,
    refundStatuses.REJECTED,
    refundStatuses.CANCELLED,
    refundStatuses.REPLACEMENT,
    refundStatuses.RECEIVED,
    refundStatuses.RETURNED,
    ],
    default: refundStatuses.REQUESTED
  },
  refundDate: { type: Date, default: Date.now },
  refundBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', autopopulate: { select: 'fullname', maxDepth: 1 } },
  refundTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: { select: 'fullname', maxDepth: 1 } },
  refundType: { type: String, enum: [refundTypes.PARTIAL, refundTypes.FULL] },
  refundMethod: {
    type: String, default: paymentMethods.WALLETs, enum: [
      paymentMethods.WALLET,

    ]
  },
  refundNote: { type: String, required: true },
  adminRefundNote: { type: String },
  sellerRefundNote: { type: String },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: { select: 'fullname _id', maxDepth: 1 } },
  refundProduct: {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, autopopulate: { select: 'productName mainImage _id', maxDepth: 1 } },
    quantity: { type: Number, required: true }
  },
  rejectByAdmin: { type: Boolean, default: false },
  refundByAdmin: { type: Boolean, default: false },
  approvedByAdmin: { type: Boolean, default: false },
  images: [{ type: String }],
  refundMethod:{type:String,default:refundMethod.WALLET,enum:Object.values(refundMethod)}

}, {
  timestamps: true
})

refundSchema.plugin(autopopulate);
refundSchema.plugin(toJSON);
refundSchema.plugin(paginate);

const Refund = mongoose.model("Refund", refundSchema);

// Export the model
module.exports = Refund;
const mongoose = require('mongoose');
var enums = require('../../config/enums')
const Schema = mongoose.Schema;

const autopopulate = require("mongoose-autopopulate");
const { toJSON, paginate } = require("../../utils/mongoose");
const paymentSchema = new Schema({

  user: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true },
  // paymentType: { type: String  },

  // createDate: {  type: Date,required: true,default: Date.now},
  status: {
    type: String,
    enum: [enums.paymentStatuses.PENDING, enums.paymentStatuses.PAID],
    default: enums.paymentStatuses.PENDING
  },
  reference_no: { type: String },
  amount: { type: Number },
  payable: { type: Number },
  paymentMethodTotal:{type:Number},

  type: {
    type: String,
    enum: [enums.paymentTypes.CASH_ON_DILIVERY, enums.paymentTypes.JAZZ_CASH],

  },
  paymentMethod: {
    type: String, default: enums.paymentMethods.COD,
    enum: { ...Object.values(enums.paymentMethods) },
  },

  orderDetail: { type: Schema.Types.ObjectId, ref: 'OrderDetail', autopopulate: true }
});
paymentSchema.plugin(autopopulate);
paymentSchema.plugin(toJSON);
paymentSchema.plugin(paginate);

// Create a model
const Payment = mongoose.model('Payment', paymentSchema);

// Export the model
module.exports = Payment;





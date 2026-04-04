const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const config = require("@/config/config");
const {gateWay}=require('../../config/enums')
const IPNSchema = new Schema({
  MerchantId : { type: String },
  MerchantName : { type: String },
  StoreId : { type: String },
  StoreName : { type: String },
  TransactionTypeId : { type: String },
  TransactionReferenceNumber : { type: String },
  OrderDateTime : { type: String},
  TransactionId : { type: String},
  TransactionDateTime : { type: String },
  AccountNumber : { type: String},
  TransactionAmount : { type: String},
  MobileNumber : { type: String},
  TransactionStatus : { type: String }, 
  callbackObject : { type: Object },
  customer: { type: mongoose.Types.ObjectId, ref: "User" },
  type:{type:String,default:gateWay.ALFALAH,enums:{...Object.values(gateWay)}}

},
  {
    timestamps: true,
    toJSON: { virtuals: true }
  });

// Post find hook

// add plugin that converts mongoose to json
IPNSchema.plugin(toJSON);
IPNSchema.plugin(paginate);
// Create a model
const IPN = mongoose.model("IPN", IPNSchema);



// Export the model
module.exports = IPN;
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const { getBucketUrl } = require("../../utils/helperFunctions");
const config = require("../../config/config");

const sellerConfidentialDetailSchema = new Schema({
  seller: { type: Schema.Types.ObjectId, ref: 'User', unique: true, },
  cnic_no: { type: String, },
  cnicImages: [{ type: String }],
  cnicFront: { type: String, },
  cnicBack: { type: String, },
  bankName: { type: String },
  bankAccountTitle: { type: String },
  bankAccountNumber: { type: String },
  apiKey: { type: String },
  secretKey: { type: String }
},
  {
    timestamps: true,
    toJSON: { virtuals: true }
  });

// Post find hook
sellerConfidentialDetailSchema.post('init', (doc) => {
  try {
    const bucketHost = getBucketUrl()
    doc.cnicImages = doc.cnicImages.map(url => {
      return url ? url.replace(bucketHost, config.aws.awsCdnHost) : url
    })
    return doc
  } catch (err) {
    return doc
  }
})

// add plugin that converts mongoose to json
sellerConfidentialDetailSchema.plugin(toJSON);
sellerConfidentialDetailSchema.plugin(paginate);
sellerConfidentialDetailSchema.plugin(autopopulate);
sellerConfidentialDetailSchema.plugin(uniqueValidator);
// Create a model
const SellerConfidentialDetail = mongoose.model("SellerConfidentialDetail", sellerConfidentialDetailSchema);

// Export the model
module.exports = SellerConfidentialDetail;
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const { getBucketUrl } = require("@/utils/helperFunctions");
const config = require("@/config/config");
const { nameSlugGenerator, removeSpaces, slugGenerator } = require("@/config/components/general.methods");
const cryptoRandomString = require("crypto-random-string");
const { regions, platforms } = require("@/config/enums");

const sellerDetailSchema = new Schema({
  seller: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  market: { type: Schema.Types.ObjectId, ref: 'Market', autopopulate: true },
  featured: { type: Boolean, default: false },
  brandName: { type: String, unique: true },
  description: { type: String, },
  images: [{ type: String }],
  city: String,
  country: {
    type: String,
    default: regions.PAK,
    enums: [regions.PAK, regions.KSA]
  },
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true }],
  categoryUpdated: { type: Boolean, default: false },
  costCode: { type: Boolean, default: false },
  costCenterCode: { type: String },
  address: String,
  cityCode: String,
  approved: { type: Boolean, default: false },
  rrp: { type: String },
  alias: { type: String },
  slug: { type: String },
  lang: Object,  //{ar:{brandName:"",description:""}}
  logo: { type: String },
  type: { type: String, enum: { ...Object.values(platforms) }, default: platforms.BAZAARGHAR },

  area: String,
  zipCode: Number,
  province: String,
  premiumPercentage:{type:Number,default:0},
  premium:{type:Boolean,default:false},
  commission: { type: Number ,default:0},
  commissionPercent:{ type: Number, min: 0, max: 100 ,default:0}
},

  {
    timestamps: true,
    toJSON: { virtuals: true }
  });

// Post find hook
sellerDetailSchema.post('init', (doc) => {
  try {
    if (config.env == 'development')
      return doc;
    const bucketHost = getBucketUrl();
    doc.images = doc.images && doc.images.map(url => {
      return url ? url.replace(bucketHost, config.aws.awsCdnHost) : url
    })
    return doc
  } catch (err) {
    throw err
    return doc
  }
})
// pre findByIdAndUpdate hook
sellerDetailSchema.pre('findOneAndUpdate', async function (next) {
  console.log(this._update)
  if (this._update && this._update.brandName) {
    this._update["alias"] = removeSpaces(this._update.brandName);
    this._update["slug"] = slugGenerator(this._update.brandName, undefined, undefined, undefined, false, false)
  }
  next();
})

//  pre save hook
sellerDetailSchema.pre('save', async function (next) {
  const sellerDetail = this;
  if (sellerDetail.isNew) {
    sellerDetail.rrp = nameSlugGenerator(sellerDetail.brandName);
    sellerDetail.slug = slugGenerator(sellerDetail.brandName, undefined, undefined, undefined, false, false);
    sellerDetail.costCenterCode = await cryptoRandomString({
      length: 8,
      type: "alphanumeric",
    });
  }
  if (sellerDetail && sellerDetail.isModified('brandName') || sellerDetail.isNew)
    sellerDetail.alias = removeSpaces(sellerDetail.brandName);
  sellerDetail.slug = slugGenerator(sellerDetail.brandName, undefined, undefined, undefined, false, false)
  next();
})



// add plugin that converts mongoose to json
sellerDetailSchema.plugin(toJSON);
sellerDetailSchema.plugin(paginate);
sellerDetailSchema.plugin(autopopulate);
sellerDetailSchema.plugin(uniqueValidator);
// Create a model
const SellerDetail = mongoose.model("SellerDetail", sellerDetailSchema);



// Export the model
module.exports = SellerDetail;
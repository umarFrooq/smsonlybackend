const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const { bannerTypes } = require("../../config/enums");
const { getBucketUrl } = require("../../utils/helperFunctions");
const config = require("../../config/config");

const bannerSchema = new Schema({

  name: { type: String, required: true },
  url: { type: String },
  type: { type: String },
  linkId: { type: String },
  image: { type: String },
  status: { type: Boolean, default: false },
  bannerSetId: { type: mongoose.Types.ObjectId, ref: "BannerSet" },
  lang: Object 
},
  {
    timestamps: true,
    toJSON: { virtuals: true }
  });

// Post find hook
bannerSchema.post('init', (doc) => {
  try {
    if(config.env == "development"){
      return doc
    }
    const bucketHost = getBucketUrl()
    doc.image = doc.image ? doc.image.replace(bucketHost, config.aws.awsCdnHost) : doc.image
    return doc
  } catch (err) {
    return doc
  }
})

// add plugin that converts mongoose to json
bannerSchema.plugin(toJSON);
bannerSchema.plugin(paginate);
// Create a model
const Banner = mongoose.model("Banner", bannerSchema);



// Export the model
module.exports = Banner;
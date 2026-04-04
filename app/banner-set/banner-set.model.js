const { bannerDevices } = require("../../config/enums");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");

const bannerSetSchema = new Schema({
    bannerName: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    active: { type: Boolean, default: false },
    slug: { type: String },
    type: { type: String },
    device: { type: String, enum: [bannerDevices.MOBILE, bannerDevices.WEB], default: bannerDevices.WEB, required: true },
    lang: {type:Object }
}, {
    timestamps: true
});

// add plugin that converts mongoose to json
bannerSetSchema.plugin(toJSON);
bannerSetSchema.plugin(paginate);
// Create a model
const BannerSet = mongoose.model("BannerSet", bannerSetSchema);



// Export the model
module.exports = BannerSet;
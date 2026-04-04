const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const { socialMedia } = require('@/config/enums');

const socialTokenModel = new Schema({
  userId: { type: mongoose.Types.ObjectId },
  token: String,
  socialMedia: { type: String, enums: { ...socialMedia }, default: socialMedia.FB },
  expiryDate: { type: Date },
  expiryDuration: { type: Number }
}, { timestamps: true });

socialTokenModel.plugin(toJSON);
socialTokenModel.plugin(paginate);

const SocialToken = mongoose.model("SocialToken", socialTokenModel);

module.exports = SocialToken;
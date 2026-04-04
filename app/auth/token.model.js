const mongoose = require('mongoose');
const { toJSON } = require('../../utils/mongoose');
const { tokenTypes } = require('../../config/token');
const { userAuthentication } = require('./auth.validations');
const tokenSchema = mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [tokenTypes.REFRESH,tokenTypes.RESET_PASSWORD,tokenTypes.Register_Or_Login,tokenTypes.Verification_Email,tokenTypes.Verification_Sms,tokenTypes.AE_ACCESS_TOKEN,tokenTypes.AE_REFRESH_TOKEN],
       required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tokenSchema.plugin(toJSON);

/**
 * @typedef Token
 */
const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;


const { toJSON } = require("../../utils/mongoose");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { addressTypes, addressLocalTypes } = require("../../config/enums");
const validator = require("validator");
const ApiError = require("../../utils/ApiError");
const { phoneNumberValidation } = require("../../utils/generalDB.methods.js/general.mongoose");

const addressSchema = new Schema({
  fullname: { type: String },
  phone: {
    type: String,
    validate(value) {
      if (!phoneNumberValidation(value)) {
        throw new ApiError(400, 'ADDRESS_MODULE.INVALID_MOBILE_NO');
      }
    },
  },
  addressType: {
    type: String,
    enum: [addressTypes.HOME, addressTypes.OFFICE, addressTypes.INTERNATIONAL],
    default: addressTypes.HOME
  },
  localType: {
    type: String,
    enum: [addressLocalTypes.LOCAL, addressLocalTypes.INTERNATIONAL],
    default: addressLocalTypes.LOCAL
  },
  country: { type: String },
  state: { type: String },
  province: { type: String },
  city: { type: String },
  city_code: { type: String },
  address: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  zipCode: { type: Number },
  addressLine_2: { type: String },
  landMark: { type: String },
  lang: Object,
  area: {
    type: String,
    // required: true
  },
  village: { type: String },
  town: { type: String },
  tahsil: { type: String },
  district: { type: String }

}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

// addressSchema.pre("save", async function (next) {
//   const address = this;

//   address.localType="local"
//   next();
// });
// add plugin that converts mongoose to json
addressSchema.plugin(toJSON);

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;







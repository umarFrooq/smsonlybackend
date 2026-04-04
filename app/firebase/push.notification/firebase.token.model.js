const { appTypes } = require("../../../config/enums");
const toJSON = require("../../../utils/mongoose/toJSON.plugin");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const firebaseTokenSchema = new Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
  token: String,
  app: { type: String, enum: [appTypes.CUSTOMER, appTypes.SELLER], default: appTypes.CUSTOMER }
},
  {
    timestamps: true
  }
);
// firebaseTokenSchema.plugin(autopopulate);
firebaseTokenSchema.plugin(toJSON);

const FirebaseToken = mongoose.model("FirebaseToken", firebaseTokenSchema);

module.exports = FirebaseToken;

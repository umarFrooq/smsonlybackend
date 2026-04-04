const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const bcrypt = require("bcryptjs");
const autopopulate = require("mongoose-autopopulate");

const walletSchema = new Schema({
    enabled: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    pin: { type: String , dafault: null },
    balance: { type: Number, default: 0 }
},
  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
);

walletSchema.methods.isPasswordMatch = async function (pin) {
  const wallet = this;
  return bcrypt.compare(pin, wallet.pin);
};

walletSchema.pre("save",async function (next) {
  const wallet = this;
  if (wallet.isModified("pin")) {
    wallet.pin = await bcrypt.hash(wallet.pin, 8);
  }
  next();
});

walletSchema.plugin(autopopulate);
walletSchema.plugin(toJSON);
walletSchema.plugin(paginate);

const Wallet = mongoose.model("Wallet", walletSchema);

// Export the model
module.exports = Wallet;

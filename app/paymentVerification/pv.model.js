const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const config = require("@/config/config");

// PV => Payment Verification
const PVSchema = new Schema({
    cart: { type: mongoose.Types.ObjectId, ref: 'Cart' },
    pvId: { type: String },
    amount: { type: Number },
    current: { type: Boolean, default: true },
    status: { type: String },
    ipn: { type: mongoose.Types.ObjectId, ref: 'IPN' },
    order: { type: mongoose.Types.ObjectId, ref: 'OrderDetail' }
},
    {
        timestamps: true,
        toJSON: { virtuals: true }
    });

// Post find hook

// add plugin that converts mongoose to json
PVSchema.plugin(toJSON);
PVSchema.plugin(paginate);
// Create a model
const PV = mongoose.model("PV", PVSchema);



// Export the model
module.exports = PV;
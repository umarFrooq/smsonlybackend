const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const mongoose_delete = require('mongoose-delete');


const reviewStatSchema = new Schema({
  typeId: { type: mongoose.Types.ObjectId, required: true, unique: true },
  sellerId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  sellerDetailId: { type: mongoose.Types.ObjectId, required: true, ref: "SellerDetail" },
  orderId: { type: mongoose.Types.ObjectId, required: true, unique: true, ref: "Order" },
  oneStar: { type: Number, required: true },
  twoStar: { type: Number, required: true },
  threeStar: { type: Number, required: true },
  fourStar: { type: Number, required: true },
  fiveStar: { type: Number, required: true },
  total: { type: Number, required: true },
  avg: { type: Number, required: true },
});

reviewStatSchema.plugin(toJSON);
reviewStatSchema.plugin(paginate);


// Create a model
const ReviewStats = mongoose.model("ReviewStats", reviewStatSchema);

// Export the model
module.exports = ReviewStats;
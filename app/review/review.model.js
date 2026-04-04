const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
const mongoose_delete = require('mongoose-delete');
const { reviewType } = require("./review.enums");
const { reportActions } = require("../../config/enums");

const autopopulate = require("mongoose-autopopulate");
const { type } = require("../../utils/redis/redis");
const reviewSchema = new Schema({
  typeId: { type: Schema.Types.ObjectId },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: { select: 'fullname', maxDepth: 1 } },
  comment: {
    dateTime: Date,
    comment: { type: String, maxlength: 500 }
  },
  response: {
    dateTime: Date,
    response: { type: String, maxlength: 500 }
  },
  rating: { type: Number, min: 1, max: 5, required: true },
  reviewType: {
    type: String,
    enum: [reviewType.PRODUCT, reviewType.SUPPLIER],
    default: reviewType.PRODUCT
  },
  reported:{
    type:String,
    enum:[reportActions.PENDING,reportActions.BLOCKED,reportActions.NONE],
    default:reportActions.NONE
  },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: { select: 'fullname', maxDepth: 1 } },
  sellerDetailId: { type: Schema.Types.ObjectId, ref: 'SellerDetail', required: true, autopopulate: { select: 'brandName images' } },
  orderId: { type: mongoose.Types.ObjectId, ref: "Order", required: true },
  images: [{ type: String }],
  reported: {
    type: String,
    enums: { ...Object.keys(reportActions) },
    default: reportActions.NONE
  }
},

  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
);


// reviewSchema.pre("find", function (next) {
//   //this.populate('category').populate('user').populate('productVaritants');

//   this.populate({ path: 'product' }).populate({ path: 'reviewer' });



//   next();
// });

// reviewSchema.pre("find", function (next) {
//   this.populate('product').populate('reviewer');

//   next();
// });

// reviewSchema.virtual('product', {
//   ref: 'Product',
//   localField: '_id',
//   foreignField: 'product'
// });

// reviewSchema.virtual('reviewer', {
//   ref: 'User',
//   foreignField: 'reviewer',
//   localField: '_id'
// });

//user can review the product once
// reviewSchema.index({ product: 1, reviewer: 1 }, { unique: true });
// add plugin that converts mongoose to json
reviewSchema.plugin(autopopulate);
reviewSchema.plugin(toJSON);
reviewSchema.plugin(paginate);
// reviewSchema.plugin(mongoose_delete,{
//   overrideMethods:{ overrideMethods: 'all' },
//   deletedAt : true
//   });

// Create a model
const Review = mongoose.model("Review", reviewSchema);

// Export the model
module.exports = Review;

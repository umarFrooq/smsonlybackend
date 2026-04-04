const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const autopopulate = require("mongoose-autopopulate");
const { toJSON, paginate } = require("../../utils/mongoose");
const { groupBuyEnum } = require('../groupBy/group_buy.enums');

const dealsSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  name: { type: String, required: true },
  limit: { type: Number },
  minOrderAmount: { type: Number },
  products: [{ type: Schema.Types.ObjectId, ref: "Product", autopopulate: { maxDepth: 1, select: 'productName mainImage slug price salePrice regularPrice onSale' } }],
  status: {
    type: String, default: groupBuyEnum.PENDING, enum:
      [
        groupBuyEnum.PENDING,
        groupBuyEnum.FINISHED,
        groupBuyEnum.ACTIVE,
        groupBuyEnum.CANCELLED
      ]
  },
  discountType: { type: String, enum:[ 'percentage', 'price' ], default: 'percentage', required: true },
  discount: { type: Number }

},
  {
    timestamps: true,
    toJSON: { virtuals: true }
  });

// add plugin that converts mongoose to json
dealsSchema.plugin(autopopulate);
dealsSchema.plugin(toJSON);
dealsSchema.plugin(paginate);


// Create a model
const deals = mongoose.model("Deals", dealsSchema);

// Export the model
module.exports = deals;
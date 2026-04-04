const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const productSchema = new Schema({

  category: { type: Schema.Types.ObjectId, ref: 'Category'},
  name: {type:String, required:true},
  description: {type: String,required:true},
  price:{type: String,required:true},
  imagesUrls : [{ type: String }],
  quantity:{type:Number},
  active:{type:Boolean}
  
});

productSchema.plugin(mongoosePaginate);

// Create a model
const Product = mongoose.model('Product', productSchema);

// Export the model
module.exports = Product;





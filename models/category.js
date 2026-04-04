const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const categorySchema = new Schema({

    name: { type: String, required: true },
    description: { type: String, required: true }

});

categorySchema.plugin(mongoosePaginate);
// Create a model
const Category = mongoose.model('Category', categorySchema);

// Export the model
module.exports = Category;
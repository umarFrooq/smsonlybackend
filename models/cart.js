const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({

    quantity: { type: Number, required: true },
    products: [
        {
            type: Schema.Types.ObjectId, ref: 'Product'
        }],
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    
});


// Create a model
const Cart = mongoose.model('Cart', cartSchema);

// Export the model
module.exports = Cart;





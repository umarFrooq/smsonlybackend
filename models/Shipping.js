const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shippingSchema = new Schema({
    
    shippingName: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    shippingCity: { type: String, required: true },
    shippingProvince: { type: String, required: true },
    shippingPhone: { type: String, required: true },
    
    orders:[
        { type: Schema.Types.ObjectId, ref: 'Order' },
    ] 

});


// Create a model
const Shipping = mongoose.model('Shipping', shippingSchema);

// Export the model
module.exports = Shipping;




const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');
const enums = require('../enums/enum');

const orderSchema = new Schema({

    user: { type: Schema.Types.ObjectId, ref: 'User' },
   
    createDate: {
        type: Date, 
        required: true,
        default: Date.now
    },
    status: {
        type: String, 
        required: true,
        enum: enums.billingStatus,
        default:'created'
    },
   
    // list of Products
    products: [
        { type: Schema.Types.ObjectId, ref: 'Product'}
    ],
    billing:{ type: Schema.Types.ObjectId, ref: 'Billing' }

});

orderSchema.plugin(mongoosePaginate);
// Create a model
const Order = mongoose.model('Order', orderSchema);

// Export the model
module.exports = Order;





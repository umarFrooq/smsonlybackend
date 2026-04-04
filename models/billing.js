const mongoose = require('mongoose');
var enums = require('../enums/enum')
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const billingSchema = new Schema({

    user: { type: Schema.Types.ObjectId, ref: 'User' },
    billingName: { type: String, required: true },
    billingAddress: { type: String, required: true },
    billingCity: { type: String, required: true },
    billingProvince: { type: String, required: true },
    billingPhone: { type: String, required: true },

    createDate: {  type: Date,required: true,default: Date.now},
    status: {type: String,required: true,enum: enums.billingStatus,default: 'created'
    },
    orderDetail: {  type: Schema.Types.ObjectId,ref: 'OrderDetail' }

});

billingSchema.plugin(mongoosePaginate);
// Create a model
const billing = mongoose.model('Billing', billingSchema);

// Export the model
module.exports = billing;





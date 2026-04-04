const mongoose = require('mongoose');
const { toJSON } = require('../../utils/mongoose');

const phoneNumberSchema = mongoose.Schema(
    {
        phoneNumber: { type: String, unique: true },
        hash: { type: Number }
    });

const PhoneModel = mongoose.model('phone', phoneNumberSchema);

module.exports = PhoneModel;
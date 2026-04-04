const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const sessionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    logoutTime: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session
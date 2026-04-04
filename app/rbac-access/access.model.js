const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accessesSchema = new Schema({
    name: { type: String },
    description: { type: String },
    label: { type: Object },
    module: { type: String },
    
},{
    timestamps: true,
});

const Accesses = mongoose.model('Accesses', accessesSchema);
module.exports = Accesses;


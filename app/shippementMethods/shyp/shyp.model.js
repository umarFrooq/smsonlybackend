const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const shypSchema = new Schema({
  country: { type: String},
  city:{ type: String },
  cityCode:{ type: String },
  state:{ type: String },
  stateId: { type: String },
  type: { type: String },
},{
  timestamps: true,
  toJSON: { virtuals: true } 
});


// Create a model
const ShypCities = mongoose.model('ShypCities', shypSchema);

// Export the model
module.exports = ShypCities;
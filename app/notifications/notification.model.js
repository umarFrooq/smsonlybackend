const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");

const notificationSchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    type: String,
    title: String,
    body: String,
    link: String
}, { timestamps: true });

// add plugin that converts mongoose to json
notificationSchema.plugin(toJSON);
notificationSchema.plugin(paginate);
// Create a model
const Notification = mongoose.model("Notification", notificationSchema);



// Export the model
module.exports = Notification;
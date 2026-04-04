const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { emailType } = require("@/config/enums");
const { toJSON, paginate } = require("../../utils/mongoose");


const campaignSchema = new Schema(
    {
        body: {
            type: String,
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId, ref: "User",
        },
        type:{
            type: String,
            enum: [...Object.values(emailType)],
            required: true

        },
        totalUsers: {
            type: Number,
            default: 1
        }
    }, {
    timestamps: true
}
)
campaignSchema.plugin(paginate);

const Campaign = mongoose.model('campaign', campaignSchema);
module.exports = Campaign
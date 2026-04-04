const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const autopopulate = require("mongoose-autopopulate");
const { toJSON, paginate } = require("../../utils/mongoose");
var { roleTypes } = require('../../config/enums')

const rbacSchema = new Schema({
    role: {
        type: String,
        unique: true,
        enums: { ...Object.values(roleTypes) },
        default: roleTypes.USER,
    },
    access: {
        type: [Schema.Types.ObjectId],
        ref: 'Accesses',
    },
    label: String,
    description: String

}, {
    timestamps: true
})
rbacSchema.plugin(autopopulate);
rbacSchema.plugin(toJSON);
rbacSchema.plugin(paginate);

const Rbac = mongoose.model('rbac', rbacSchema);


module.exports = Rbac
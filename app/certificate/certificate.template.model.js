const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const certificateTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true }, // e.g., 'completion', 'id-card'
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    html: { type: String }, // raw HTML with placeholders (Handlebars)
    assets: [
      {
        name: String,
        url: String,
      },
    ],
    placeholders: [String],
    meta: {
      pageSize: { type: String, default: 'A4' },
      width: String,
      height: String,
      margins: Object,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

certificateTemplateSchema.plugin(toJSON);
certificateTemplateSchema.plugin(paginate);

const CertificateTemplate = mongoose.model('CertificateTemplate', certificateTemplateSchema);

module.exports = CertificateTemplate;

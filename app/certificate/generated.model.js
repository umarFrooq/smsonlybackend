const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const generatedCertificateSchema = new mongoose.Schema(
  {
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateTemplate' },
    certificateType: { type: String, required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    filePath: { type: String }, // local path or S3 key
    fileName: { type: String },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    generatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['generated', 'pending', 'failed'], default: 'generated' },
    metadata: { type: Object },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Enforce one-per-student-per-type by default; change if versioning desired
generatedCertificateSchema.index({ studentId: 1, certificateType: 1 }, { unique: true, sparse: true });

generatedCertificateSchema.plugin(toJSON);
generatedCertificateSchema.plugin(paginate);

const GeneratedCertificate = mongoose.model('GeneratedCertificate', generatedCertificateSchema);

module.exports = GeneratedCertificate;

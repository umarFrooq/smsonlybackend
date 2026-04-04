const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist

const fineSchema = new mongoose.Schema(
  {
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    schoolId: { // Added schoolId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Branch', 
      required: true 
    },
    type: { // e.g., 'late_fee_submission', 'damage_to_property', 'library_overdue'
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      trim: true, 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'waived'], 
      default: 'pending', 
      required: true 
    },
    relatedFeeId: { // Optional: if this fine is directly linked to a specific fee installment
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Fee' 
    },
    paymentDate: { // Applicable if status is 'paid'
      type: Date 
    },
    paymentTransactionId: { // Optional transaction ID if paid via gateway
      type: String, 
      trim: true 
    },
    issuedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    waivedBy: { // Applicable if status is 'waived'
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    waiveReason: { // Applicable if status is 'waived'
      type: String, 
      trim: true 
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
fineSchema.plugin(toJSON);
fineSchema.plugin(paginate);

// Indexes
fineSchema.index({ studentId: 1, status: 1 });
fineSchema.index({ branchId: 1, status: 1 });

const Fine = mongoose.model("Fine", fineSchema);

module.exports = Fine;

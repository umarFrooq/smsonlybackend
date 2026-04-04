const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist

const paymentRecordSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, sparse: true }, // Optional, can be from a payment gateway
  amountPaid: { type: Number, required: true, min: 0 },
  paymentDate: { type: Date, default: Date.now, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'online_banking', 'cheque', 'wallet', 'other'], 
    default: 'other' 
  },
  remarks: { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // User who recorded this payment
}, { _id: true, timestamps: true }); // Allow _id for individual payment records, add timestamps

const discountAppliedSchema = new mongoose.Schema({
  type: { // e.g., 'scholarship', 'sibling_discount', 'early_bird'
    type: String, 
    required: true,
    trim: true
  },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true },
  // authorizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Optional: if discount needs authorization
}, { _id: false });

const feeSchema = new mongoose.Schema(
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
    gradeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Grade', 
      required: true 
    },
    branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Branch', 
      required: true 
    },
    feeStructureId: { // For future use, to link to a predefined fee structure
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'FeeStructure' 
    },
    feeType: {
      type: String,
      enum: ['monthly'],
      default: 'monthly',
      required: true
    },
    monthYear: { // Format: YYYY-MM
      type: String, 
      required: true, 
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'monthYear must be in YYYY-MM format (e.g., 2023-07).']
    },
    dueDate: { 
      type: Date, 
      required: true 
    },
    totalAmount: { // Original amount due before any discounts or payments
      type: Number, 
      required: true, 
      min: 0 
    },
    // Snapshot of the monthly fee applied when this fee record was created.
    // This preserves historical rate even if user's `monthlyFee` changes later.
    appliedMonthlyFee: {
      type: Number,
      min: 0,
    },
    // Semester flow removed — fees are monthly-only
    paidAmount: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    remainingAmount: { 
      type: Number, 
      min: 0 
    },
    status: { 
      type: String, 
      enum: ['pending', 'partially_paid', 'paid', 'overdue', 'waived'], 
      default: 'pending', 
      required: true 
    },
    fineApplied: { // For future use, if a late fine is applied
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Fine' 
    },
    discountApplied: discountAppliedSchema, // Single discount object for simplicity, can be array if multiple needed
    paymentRecords: [paymentRecordSchema],
    description: { 
      type: String, 
      trim: true 
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
feeSchema.plugin(toJSON);
feeSchema.plugin(paginate);

// Pre-save hook
feeSchema.pre('save', async function(next) {
  try {
    // Fetch total fee from User model if not already set or if studentId changed
    if (!this.totalAmount || this.isModified('studentId')) {
      const User = mongoose.model('User');
      const student = await User.findById(this.studentId).select('monthlyFee');
      if (student && student.monthlyFee) {
        this.totalAmount = student.monthlyFee;
      } else if (!this.totalAmount) {
        // If no monthlyFee is set in user model and no totalAmount provided, default to 0
        this.totalAmount = 0;
      }
    }

    // Calculate paidAmount from paymentRecords
    this.paidAmount = this.paymentRecords.reduce((total, payment) => {
      return total + (payment.amountPaid || 0);
    }, 0);

    // No semester flow — monthly-only fees

    // Calculate remainingAmount
    let totalDue = this.totalAmount;
    if (this.discountApplied && this.discountApplied.amount) {
      totalDue -= this.discountApplied.amount;
    }
    // Ensure totalDue is not negative after discount
    totalDue = Math.max(0, totalDue); 

    this.remainingAmount = Math.max(0, totalDue - this.paidAmount);

    // Snapshot the applied monthly fee so history preserves the rate used when fee was created
    if (!this.appliedMonthlyFee || this.isModified('totalAmount') || this.isModified('studentId')) {
      this.appliedMonthlyFee = this.totalAmount;
    }

    // Update status based on amounts and dueDate
    if (this.status === 'waived') {
        // If waived, it remains waived. paidAmount could be 0.
        this.remainingAmount = 0; // If waived, remaining is 0 regardless of paid.
    } else if (totalDue === 0) {
        // Special case: if total due is 0, status should be pending until a proper fee amount is set
        this.status = 'pending';
        this.remainingAmount = 0;
    } else if (this.paidAmount >= totalDue) {
        this.status = 'paid';
        this.remainingAmount = 0; // Ensure remaining is exactly 0 if paid in full or overpaid
    } else if (this.paidAmount > 0 && this.paidAmount < totalDue) {
        this.status = 'partially_paid';
    } else { // paidAmount is 0 or less than totalDue (and not partially_paid already)
        this.status = 'pending';
    }

  // Check for overdue status, but only if not already paid or waived
  if (this.status !== 'paid' && this.status !== 'waived' && this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  
  next();
  } catch (error) {
    next(error);
  }
});

// Index for common queries
feeSchema.index({ studentId: 1, monthYear: 1 });
feeSchema.index({ branchId: 1, gradeId: 1, status: 1 });
feeSchema.index({ status: 1, dueDate: 1 });


const Fee = mongoose.model("Fee", feeSchema);

module.exports = Fee;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");

// Complaint Types: Academic (Teacher/Subject/Admin) or General (Infrastructure)
const complaintTypes = {
  TEACHER: 'teacher',
  SUBJECT: 'subject', 
  ADMIN: 'admin',
  BRANCH: 'branch',
  GRADE: 'grade',
  GENERAL: 'general', // For infrastructure issues like water, building, transport
  STUDENT: 'student' // When teachers/admins report against students
};

// General complaint categories for infrastructure issues
const generalComplaintCategories = {
  WATER: 'water',
  BUILDING: 'building', 
  TRANSPORT: 'transport',
  ELECTRICITY: 'electricity',
  CLEANLINESS: 'cleanliness',
  CAFETERIA: 'cafeteria',
  LIBRARY: 'library',
  PLAYGROUND: 'playground',
  OTHER: 'other'
};

// Complaint status lifecycle
const complaintStatuses = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress', 
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REOPENED: 'reopened'
};

// Priority levels
const complaintPriorities = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const complaintResponseSchema = new Schema({
  respondedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  response: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  responseDate: {
    type: Date,
    default: Date.now
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { _id: true });

const complaintSchema = new Schema({
  // Core complaint information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Type and target information
  complaintType: {
    type: String,
    enum: Object.values(complaintTypes),
    required: true
  },
  
  // Target IDs (what/who the complaint is about)
  targetTeacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.complaintType === complaintTypes.TEACHER; }
  },
  targetSubjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: function() { return this.complaintType === complaintTypes.SUBJECT; }
  },
  targetAdminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.complaintType === complaintTypes.ADMIN; }
  },
  targetStudentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.complaintType === complaintTypes.STUDENT; }
  },
  targetBranchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: function() { return this.complaintType === complaintTypes.BRANCH; }
  },
  targetGradeId: {
    type: Schema.Types.ObjectId,
    ref: 'Grade',
    required: function() { return this.complaintType === complaintTypes.GRADE; }
  },
  
  // For general complaints (infrastructure issues)
  generalCategory: {
    type: String,
    enum: Object.values(generalComplaintCategories),
    required: function() { return this.complaintType === complaintTypes.GENERAL; }
  },
  
  // Complainant information
  complainantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  complainantRole: {
    type: String,
    enum: ['student', 'parent', 'teacher', 'admin', 'superadmin'],
    required: true
  },
  
  // If complaint is about a student, link to student for easy access
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function() { 
      return this.complaintType === complaintTypes.STUDENT || 
             (this.complainantRole === 'student' || this.complainantRole === 'parent');
    }
  },
  
  // School and branch context
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch'
  },
  gradeId: {
    type: Schema.Types.ObjectId,
    ref: 'Grade'
  },
  
  // Status and priority
  status: {
    type: String,
    enum: Object.values(complaintStatuses),
    default: complaintStatuses.PENDING
  },
  priority: {
    type: String,
    enum: Object.values(complaintPriorities),
    default: complaintPriorities.MEDIUM
  },
  
  // Assigned personnel
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: {
    type: Date
  },
  
  // Response and resolution
  responses: [complaintResponseSchema],
  
  // Resolution information
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedDate: {
    type: Date
  },
  resolutionNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Attachments and evidence
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Anonymous complaint option
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Escalation tracking
  escalationLevel: {
    type: Number,
    default: 0
  },
  escalatedAt: {
    type: Date
  },
  escalatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Urgency flags
  isUrgent: {
    type: Boolean,
    default: false
  },
  
  // Visibility flags
  // Visibility flags: control whether specific targets can see the complaint
  visibleToTeacher: {
    type: Boolean,
    default: true
  },
  visibleToStudent: {
    type: Boolean,
    default: true
  },
  // Track who approved making the complaint visible and when
  visibilityApprovedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  visibilityApprovedAt: {
    type: Date
  },
  
  // Satisfaction rating (after resolution)
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  satisfactionFeedback: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Due date for resolution
  dueDate: {
    type: Date
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true
  }],
  
  // Notification tracking
  notifications: {
    emailSent: { type: Boolean, default: false },
    smsSent: { type: Boolean, default: false },
    pushSent: { type: Boolean, default: false }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for better query performance
complaintSchema.index({ schoolId: 1, status: 1 });
complaintSchema.index({ complainantId: 1, createdAt: -1 });
complaintSchema.index({ targetTeacherId: 1, status: 1 });
complaintSchema.index({ targetStudentId: 1, status: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ complaintType: 1, schoolId: 1 });
complaintSchema.index({ branchId: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

// Plugins
complaintSchema.plugin(toJSON);
complaintSchema.plugin(paginate);

// Export the model and enums
module.exports = {
  Complaint: mongoose.model("Complaint", complaintSchema),
  complaintTypes,
  generalComplaintCategories,
  complaintStatuses,
  complaintPriorities
};

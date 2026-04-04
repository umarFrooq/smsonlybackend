const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const complaintTypes = {
  TEACHER: 'teacher',
  SUBJECT: 'subject', 
  ADMIN: 'admin',
  BRANCH: 'branch',
  GRADE: 'grade',
  GENERAL: 'general',
  STUDENT: 'student'
};

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

const complaintStatuses = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress', 
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REOPENED: 'reopened'
};

const complaintPriorities = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const createComplaint = {
  body: Joi.object().keys({
    title: Joi.string().required().max(200),
    description: Joi.string().required().max(2000),
    complaintType: Joi.string().valid(...Object.values(complaintTypes)).required(),
    
    // Target fields (conditional based on complaint type)
    targetTeacherId: Joi.string().custom(objectId).when('complaintType', {
      is: complaintTypes.TEACHER,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    targetSubjectId: Joi.string().custom(objectId).when('complaintType', {
      is: complaintTypes.SUBJECT,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    targetAdminId: Joi.string().custom(objectId).when('complaintType', {
      is: complaintTypes.ADMIN,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    targetStudentId: Joi.string().custom(objectId).when('complaintType', {
      is: complaintTypes.STUDENT,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    targetBranchId: Joi.string().custom(objectId).when('complaintType', {
      is: complaintTypes.BRANCH,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    targetGradeId: Joi.string().custom(objectId).when('complaintType', {
      is: complaintTypes.GRADE,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    generalCategory: Joi.string().valid(...Object.values(generalComplaintCategories)).when('complaintType', {
      is: complaintTypes.GENERAL,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    
    // Optional fields
    priority: Joi.string().valid(...Object.values(complaintPriorities)),
    isAnonymous: Joi.boolean(),
    isUrgent: Joi.boolean(),
    dueDate: Joi.date(),
    tags: Joi.array().items(Joi.string().trim()),
    
    // For students: their own studentId should be set automatically
    studentId: Joi.string().custom(objectId),
    
    // School and branch context (set automatically by backend)
    schoolId: Joi.string().custom(objectId),
    // branchId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    
    // Attachments
    attachments: Joi.array().items(Joi.object({
      filename: Joi.string().required(),
      url: Joi.string().required()
    }))
  })
};

const getComplaints = {
  query: Joi.object().keys({
    complaintType: Joi.string().valid(...Object.values(complaintTypes)),
    status: Joi.string().valid(...Object.values(complaintStatuses)),
    priority: Joi.string().valid(...Object.values(complaintPriorities)),
    assignedTo: Joi.string().custom(objectId),
    targetTeacherId: Joi.string().custom(objectId),
    targetStudentId: Joi.string().custom(objectId),
    complainantId: Joi.string().custom(objectId),
    generalCategory: Joi.string().valid(...Object.values(generalComplaintCategories)),
    dateFrom: Joi.date(),
    dateTo: Joi.date(),
    isUrgent: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    branchId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    search: Joi.string()
  })
};

const getComplaint = {
  params: Joi.object().keys({
    complaintId: Joi.string().custom(objectId).required()
  })
};

const updateComplaint = {
  params: Joi.object().keys({
    complaintId: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    title: Joi.string().max(200),
    description: Joi.string().max(2000),
    priority: Joi.string().valid(...Object.values(complaintPriorities)),
    assignedTo: Joi.string().custom(objectId),
    dueDate: Joi.date(),
    tags: Joi.array().items(Joi.string().trim()),
    isUrgent: Joi.boolean(),
    
    // Allow status updates for authorized users
    status: Joi.string().valid(...Object.values(complaintStatuses)),
    
    // Escalation
    escalationLevel: Joi.number().integer().min(0),
    
    // Resolution (only for authorized users)
    resolutionNotes: Joi.string().max(1000),
    satisfactionRating: Joi.number().integer().min(1).max(5),
    satisfactionFeedback: Joi.string().max(500)
    
  }).min(1)
};

const deleteComplaint = {
  params: Joi.object().keys({
    complaintId: Joi.string().custom(objectId).required()
  })
};

const addResponse = {
  params: Joi.object().keys({
    complaintId: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    response: Joi.string().required().max(1000),
    attachments: Joi.array().items(Joi.object({
      filename: Joi.string().required(),
      url: Joi.string().required()
    }))
  })
};

const assignComplaint = {
  params: Joi.object().keys({
    complaintId: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    assignedTo: Joi.string().custom(objectId).required()
  })
};

const escalateComplaint = {
  params: Joi.object().keys({
    complaintId: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    escalationReason: Joi.string().required().max(500)
  })
};

const resolveComplaint = {
  params: Joi.object().keys({
    complaintId: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    resolutionNotes: Joi.string().required().max(1000),
    status: Joi.string().valid(complaintStatuses.RESOLVED, complaintStatuses.CLOSED).required()
  })
};

const getComplaintStats = {
  query: Joi.object().keys({
    dateFrom: Joi.date(),
    dateTo: Joi.date(),
    branchId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    complaintType: Joi.string().valid(...Object.values(complaintTypes))
  })
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  addResponse,
  assignComplaint,
  escalateComplaint,
  resolveComplaint,
  getComplaintStats
};

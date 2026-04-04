const Joi = require('joi');
const { objectId } = require('../auth/custom.validation'); // Assuming this custom validation exists

const createAssignment = {
  body: Joi.object().keys({
    title: Joi.string().required().trim().min(3).max(255),
    description: Joi.string().trim().allow(null, '').max(5000),
    subjectId: Joi.string().custom(objectId).required(),
    // teacherId will be taken from req.user
    gradeId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    // schoolId will be taken from req.schoolId or req.user for rootAdmin
    dueDate: Joi.date().iso().required().min('now'), // Due date must be in ISO format and in the future
    totalMarks: Joi.number().required().min(0).max(1000), // Max 1000 marks, adjust as needed
    allowLateSubmission: Joi.boolean().default(false),
    lateSubmissionPenaltyPercentage: Joi.number().min(0).max(100).when('allowLateSubmission', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional().allow(null, 0), // Optional or 0 if late submission not allowed
    }),
    fileAttachments: Joi.array().items(
      Joi.object({
        fileName: Joi.string().required().trim().max(255),
        filePath: Joi.string().required().trim().uri(), // Assuming filePath is a URL
        fileType: Joi.string().trim().max(50),
      })
    ).max(5), // Max 5 attachments, adjust as needed
    status: Joi.string().valid('draft', 'published').default('published'), // Only allow draft or published on creation by teacher
  }),
};

const getAssignments = {
  query: Joi.object().keys({
    title: Joi.string().trim(),
    subjectId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    teacherId: Joi.string().custom(objectId), // For admin/superadmin to filter by teacher
    studentId: Joi.string().custom(objectId), // For student to get their assignments (service will use this)
    dueDateFrom: Joi.date().iso(),
    dueDateTo: Joi.date().iso().min(Joi.ref('dueDateFrom')),
    status: Joi.string().valid('draft', 'published', 'archived'),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
    populate: Joi.string(), // e.g., "subjectId,gradeId"
    schoolId: Joi.string().custom(objectId), // For rootUser to filter by school
  }),
};

const getAssignment = {
  params: Joi.object().keys({
    assignmentId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    populate: Joi.string(),
  }),
};

const updateAssignment = {
  params: Joi.object().keys({
    assignmentId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim().min(3).max(255),
      description: Joi.string().trim().allow(null, '').max(5000),
      subjectId: Joi.string().custom(objectId),
      gradeId: Joi.string().custom(objectId),
      // branchId and schoolId should not be changed directly via this update for a specific assignment
      dueDate: Joi.date().iso().min('now'),
      totalMarks: Joi.number().min(0).max(1000),
      allowLateSubmission: Joi.boolean(),
      lateSubmissionPenaltyPercentage: Joi.number().min(0).max(100).when('allowLateSubmission', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional().allow(null, 0),
      }),
      fileAttachments: Joi.array().items(
        Joi.object({
          fileName: Joi.string().required().trim().max(255),
          filePath: Joi.string().required().trim().uri(),
          fileType: Joi.string().trim().max(50),
        })
      ).max(5),
      status: Joi.string().valid('draft', 'published', 'archived'),
    })
    .min(1), // Requires at least one field to be updated
};

const deleteAssignment = {
  params: Joi.object().keys({
    assignmentId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
};

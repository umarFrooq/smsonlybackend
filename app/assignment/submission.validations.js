const Joi = require('joi');
const { objectId } = require('../auth/custom.validation'); // Assuming this custom validation exists

const createSubmission = {
  params: Joi.object().keys({
    assignmentId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    // studentId will be taken from req.user
    submittedFiles: Joi.array().items(
      Joi.object({
        fileName: Joi.string().required().trim().max(255),
        filePath: Joi.string().required().trim().uri(), // Assuming filePath is a URL
        fileType: Joi.string().trim().max(50),
      })
    ).min(1).max(5).required(), // Student must submit at least 1 file, max 5 (adjust as needed)
    studentRemarks: Joi.string().trim().allow(null, '').max(2000),
  }),
};

const getSubmissions = {
  query: Joi.object().keys({
    assignmentId: Joi.string().custom(objectId), // For teachers to filter by assignment
    studentId: Joi.string().custom(objectId), // For students to filter by their ID (or admin to filter by student)
    status: Joi.string().valid('submitted', 'graded', 'resubmitted', 'pending_review'),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
    populate: Joi.string(), // e.g., "studentId,assignmentId"
    schoolId: Joi.string().custom(objectId), // For rootUser/admin to filter by school (via assignment's school)
    gradeId: Joi.string().custom(objectId), // For rootUser/admin to filter by grade (via assignment's grade)
  }),
};

const getSubmission = {
  params: Joi.object().keys({
    submissionId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    populate: Joi.string(),
  }),
};

const gradeSubmission = {
  params: Joi.object().keys({
    submissionId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    obtainedMarks: Joi.number().required().min(0), // Max value validation against assignment.totalMarks will be in service
    teacherRemarks: Joi.string().trim().allow(null, '').max(5000),
    // status could be updated automatically by the service, e.g., to 'graded'
  }).min(1), // At least obtainedMarks or teacherRemarks should be provided for grading
};

module.exports = {
  createSubmission,
  getSubmissions,
  getSubmission,
  gradeSubmission,
};

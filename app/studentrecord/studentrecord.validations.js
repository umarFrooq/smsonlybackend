const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");
const getStudentRecord = {
  params: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    // Placeholder for future granularity, not used in service for now but good for API design
    includeAttendance: Joi.boolean().default(true),
    includeTestResults: Joi.boolean().default(true),
    attendanceStartDate: Joi.date().iso(),
    attendanceEndDate: Joi.date().iso(),
    // Add more specific query params as needed, e.g., which fields to populate for sub-documents
    populateUser: Joi.string().default('permanentAddress,currentAddress,branch'), // Default population for user
    populateTestResults: Joi.string().default('testId'), // Default population for test results
  }),
};

module.exports = {
  getStudentRecord,
};

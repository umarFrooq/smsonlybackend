const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const getStudentsWithCertificates = {
  query: Joi.object().keys({
    name: Joi.string(),
    registrationNumber: Joi.string(),
    cnic: Joi.string(),
    gradeId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const uploadCertificate = {
  params: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
  // File validation will be handled by multer middleware
};

const updateCertificate = {
  params: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
  // File validation will be handled by multer middleware
};

const deleteCertificate = {
  params: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  getStudentsWithCertificates,
  uploadCertificate,
  updateCertificate,
  deleteCertificate,
};

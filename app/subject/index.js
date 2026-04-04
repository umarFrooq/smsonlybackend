const Subject = require('./subject.model');
const subjectService = require('./subject.service');
const subjectController = require('./subject.controller');
const subjectValidations = require('./subject.validations');
// The router from subject.routes.js is typically not re-exported through index.js
// as it's directly used in app/routes.js.

module.exports = {
  Subject,
  subjectService,
  subjectController,
  subjectValidations,
};

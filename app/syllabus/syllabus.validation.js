const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const createSyllabus = {
  body: Joi.object().keys({
  // schoolId will normally be injected from the authenticated request (req.schoolId).
  // Make it optional here so clients don't have to provide it; server will scope by auth.
  schoolId: Joi.string().custom(objectId).optional(),
    branchId: Joi.string().custom(objectId).allow('', null),
    gradeId: Joi.string().custom(objectId).required(),
    subjectId: Joi.string().custom(objectId).required(),
    title: Joi.string().trim().allow('', null),
    year: Joi.number().integer().min(2000).max(3000),
    items: Joi.array().items(
      Joi.object().keys({
  // Month may be null/empty in frontend inputs; allow null here and validate/sanitize server-side.
  month: Joi.number().integer().min(1).max(12).optional().allow(null),
        startDate: Joi.date().optional().allow(null),
        endDate: Joi.date().optional().allow(null),
        // Allow empty chapter strings from frontend inputs; trim strings and permit '' or null
        chapters: Joi.array().items(Joi.string().trim().allow('', null)).min(0),
        targetNotes: Joi.string().trim().allow('', null),
      })
    ).optional()
  })
};

const getSyllabi = {
  query: Joi.object().keys({
    schoolId: Joi.string().custom(objectId).optional().allow('', null),
    // Query params often contain empty strings when dropdowns are unselected in the UI.
    // Allow empty string/null so validation doesn't fail; controller will ignore empty filters.
    branchId: Joi.string().custom(objectId).optional().allow('', null),
    gradeId: Joi.string().custom(objectId).optional().allow('', null),
    subjectId: Joi.string().custom(objectId).optional().allow('', null),
    year: Joi.number().integer(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(),
  })
};

const getSyllabus = {
  params: Joi.object().keys({
    syllabusId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({ populate: Joi.string() })
};

const updateSyllabus = {
  params: Joi.object().keys({ syllabusId: Joi.string().custom(objectId).required() }),
  body: Joi.object().keys({
    branchId: Joi.string().custom(objectId).allow('', null),
    gradeId: Joi.string().custom(objectId),
    subjectId: Joi.string().custom(objectId),
    title: Joi.string().trim().allow('', null),
    year: Joi.number().integer().min(2000).max(3000),
    items: Joi.array().items(
      Joi.object().keys({
  // Allow null during updates; controller will filter out invalid items.
  month: Joi.number().integer().min(1).max(12).optional().allow(null),
        startDate: Joi.date().optional().allow(null),
        endDate: Joi.date().optional().allow(null),
        // Allow empty chapter strings during updates as well
        chapters: Joi.array().items(Joi.string().trim().allow('', null)).min(0),
        targetNotes: Joi.string().trim().allow('', null),
      })
    ).optional()
  }).min(1)
};

const deleteSyllabus = {
  params: Joi.object().keys({ syllabusId: Joi.string().custom(objectId).required() })
};

module.exports = {
  createSyllabus,
  getSyllabi,
  getSyllabus,
  updateSyllabus,
  deleteSyllabus,
};

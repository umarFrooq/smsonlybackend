const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const { createSyllabus, querySyllabi, getSyllabusById, updateSyllabusById, deleteSyllabusById, getTimeline } = require('./syllabus.service');

const createSyllabusHandler = catchAsync(async (req, res) => {
  const schoolId = req.schoolId || (req.user.role === 'rootUser' ? req.body.schoolId : null);
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required');
  }
  if (req.user.role !== 'rootUser' && req.body.schoolId && req.body.schoolId !== schoolId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You cannot create syllabus for a different school');
  }
  const body = { ...req.body, schoolId: req.body.schoolId || schoolId };
  // Sanitize items: trim chapters and remove empty chapter strings; drop items without a valid month
  if (Array.isArray(body.items)) {
    const cleaned = body.items
      .filter((it) => it != null)
      .map((it) => {
        const chapters = Array.isArray(it.chapters)
          ? it.chapters.map((c) => (typeof c === 'string' ? c.trim() : '')).filter((c) => c !== '')
          : [];
        const month = Number.isInteger(it.month) ? it.month : null;
        return {
          month,
          startDate: it.startDate || null,
          endDate: it.endDate || null,
          chapters,
          targetNotes: typeof it.targetNotes === 'string' ? it.targetNotes.trim() : '',
        };
      })
      .filter((it) => it.month && it.month >= 1 && it.month <= 12);
    if (cleaned.length) body.items = cleaned;
    else delete body.items;
  }

  const doc = await createSyllabus(body, req.user.id);
  res.status(httpStatus.CREATED).send({ success: true, data: doc, message: 'Syllabus created' });
});

const getSyllabiHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['schoolId', 'branchId', 'gradeId', 'subjectId', 'year']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  if (req.user.role !== 'rootUser') {
    if (filter.schoolId && filter.schoolId !== req.schoolId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only query syllabi for your assigned school');
    }
    filter.schoolId = req.schoolId;
  }

  // Normalize filter: remove empty string/null values so mongoose doesn't try to cast '' to ObjectId
  Object.keys(filter).forEach((k) => {
    if (filter[k] === '' || filter[k] === null || typeof filter[k] === 'undefined') {
      delete filter[k];
    }
  });

  // Ensure numeric year if provided as string
  if (filter.year) {
    const y = Number(filter.year);
    if (!Number.isNaN(y)) filter.year = y;
    else delete filter.year;
  }

  const result = await querySyllabi(filter, options);
  res.status(httpStatus.OK).send({ success: true, data: result });
});

const getSyllabusHandler = catchAsync(async (req, res) => {
  const populate = req.query.populate;
  const schoolId = req.user.role !== 'rootUser' ? req.schoolId : (req.query.schoolId || null);
  const doc = await getSyllabusById(req.params.syllabusId, schoolId, populate);
  res.status(httpStatus.OK).send({ success: true, data: doc });
});

const updateSyllabusHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role !== 'rootUser' ? req.schoolId : (req.body.schoolIdForScope || null);
  // Sanitize incoming items similarly to create
  const body = { ...req.body };
  if (Array.isArray(body.items)) {
    const cleaned = body.items
      .filter((it) => it != null)
      .map((it) => {
        const chapters = Array.isArray(it.chapters)
          ? it.chapters.map((c) => (typeof c === 'string' ? c.trim() : '')).filter((c) => c !== '')
          : [];
        const month = Number.isInteger(it.month) ? it.month : null;
        return {
          month,
          startDate: it.startDate || null,
          endDate: it.endDate || null,
          chapters,
          targetNotes: typeof it.targetNotes === 'string' ? it.targetNotes.trim() : '',
        };
      })
      .filter((it) => it.month && it.month >= 1 && it.month <= 12);
    if (cleaned.length) body.items = cleaned;
    else delete body.items;
  }

  const doc = await updateSyllabusById(req.params.syllabusId, body, req.user.id, schoolId);
  res.status(httpStatus.OK).send({ success: true, data: doc, message: 'Syllabus updated' });
});

const deleteSyllabusHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role !== 'rootUser' ? req.schoolId : (req.query.schoolIdForScope || null);
  await deleteSyllabusById(req.params.syllabusId, schoolId);
  res.status(httpStatus.OK).send({ success: true, data: null, message: 'Syllabus deleted' });
});

const getTimelineHandler = catchAsync(async (req, res) => {
  const { gradeId, subjectId } = req.params;
  const params = pick(req.query, ['year', 'month']);
  // enforce school scope if needed (we assume grade/subject belong to school)
  const items = await getTimeline(gradeId, subjectId, params);
  res.status(httpStatus.OK).send({ success: true, data: items });
});

module.exports = {
  createSyllabusHandler,
  getSyllabiHandler,
  getSyllabusHandler,
  updateSyllabusHandler,
  deleteSyllabusHandler,
  getTimelineHandler,
};

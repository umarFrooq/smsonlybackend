const httpStatus = require('http-status');
const Syllabus = require('./syllabus.model');
const ApiError = require('../../utils/ApiError');

/**
 * Create a syllabus
 * @param {Object} syllabusBody
 * @param {ObjectId} userId
 */
const createSyllabus = async (syllabusBody, userId) => {
  const toSave = { ...syllabusBody, createdBy: userId };
  const created = await Syllabus.create(toSave);
  return created;
};

const querySyllabi = async (filter, options) => {
  const { populate, ...rest } = options || {};
  const result = await Syllabus.paginate(filter, rest);
  if (populate && result.results && result.results.length) {
    const paths = populate.split(',').map(p => p.trim());
    const popArr = [];
    for (const p of paths) {
      const pathObj = { path: p };
      if (p === 'gradeId') pathObj.select = 'id title';
      if (p === 'subjectId') pathObj.select = 'id title';
      if (p === 'branchId') pathObj.select = 'id name';
      if (p === 'schoolId') pathObj.select = 'id name';
      popArr.push(pathObj);
    }
    await Syllabus.populate(result.results, popArr);
  }
  return result;
};

const getSyllabusById = async (id, schoolId = null, populate = null) => {
  const query = { _id: id };
  if (schoolId) query.schoolId = schoolId;
  let q = Syllabus.findOne(query);
  if (populate) {
    const paths = populate.split(',').map(p => p.trim());
    const popArr = paths.map(p => ({ path: p }));
    q = q.populate(popArr);
  }
  const doc = await q.exec();
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'Syllabus not found');
  return doc;
};

const updateSyllabusById = async (id, updateBody, userId, schoolId = null) => {
  const syllabus = await getSyllabusById(id, schoolId);
  if (updateBody.schoolId && String(updateBody.schoolId) !== String(syllabus.schoolId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change school of syllabus');
  }
  delete updateBody.schoolId;
  Object.assign(syllabus, updateBody, { updatedBy: userId });
  await syllabus.save();
  return syllabus;
};

const deleteSyllabusById = async (id, schoolId = null) => {
  const syllabus = await getSyllabusById(id, schoolId);
  await syllabus.remove();
  return syllabus;
};

const getTimeline = async (gradeId, subjectId, params = {}) => {
  const { year, month } = params;
  const filter = { gradeId, subjectId };
  if (year) filter.year = year;
  const syllabi = await Syllabus.find(filter).lean();
  // Aggregate timeline items from found syllabi
  const items = [];
  syllabi.forEach(s => {
    (s.items || []).forEach(it => {
      if (!month || it.month === month) {
        items.push({ ...it, syllabusId: s._id, title: s.title, year: s.year });
      }
    });
  });
  return items;
};

module.exports = {
  createSyllabus,
  querySyllabi,
  getSyllabusById,
  updateSyllabusById,
  deleteSyllabusById,
  getTimeline,
};

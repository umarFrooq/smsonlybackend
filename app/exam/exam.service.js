const httpStatus = require('http-status');
const { Exam } = require('../../config/mongoose');
const ApiError = require('../../utils/ApiError');

/**
 * Create a exam
 * @param {Object} examBody
 * @param {Object} user
 * @returns {Promise<Exam>}
 */
const createExam = async (examBody, user) => {
  // Normalize incoming payload: support either gradeIds array or allGrades flag
  const examData = { ...examBody, createdBy: user._id, schoolId: user.schoolId._id };
  // If incoming uses gradeId (single) maintain compatibility
  if (examData.gradeId && !examData.gradeIds) {
    examData.gradeIds = [examData.gradeId];
    delete examData.gradeId;
  }
  return Exam.create(examData);
};

/**
 * Query for exams
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryExams = async (filter, options) => {
  // Ensure compatibility: if filtering by gradeId convert to gradeIds
  if (filter.gradeId) {
    filter.gradeIds = Array.isArray(filter.gradeId) ? filter.gradeId : [filter.gradeId];
    delete filter.gradeId;
  }
  const exams = await Exam.paginate(filter, { ...options, populate: 'gradeIds' });
  return exams;
};

/**
 * Get exam by id
 * @param {ObjectId} id
 * @returns {Promise<Exam>}
 */
const getExamById = async (id) => {
  return Exam.findById(id).populate('gradeIds');
};

/**
 * Update exam by id
 * @param {ObjectId} examId
 * @param {Object} updateBody
 * @returns {Promise<Exam>}
 */
const { User } = require('../../config/mongoose');
const { sendExamAnnouncementEmail } = require('../notifications/email.service');

const updateExamById = async (examId, updateBody) => {
  const exam = await getExamById(examId);
  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }
  Object.assign(exam, updateBody);
  await exam.save();

  if (updateBody.status === 'announced') {
    let students = [];
    if (exam.allGrades) {
      students = await User.find({ role: 'student', schoolId: exam.schoolId });
    } else if (Array.isArray(exam.gradeIds) && exam.gradeIds.length) {
      students = await User.find({ gradeId: { $in: exam.gradeIds }, role: 'student', schoolId: exam.schoolId });
    }
    for (const student of students) {
      if (student.email) {
        await sendExamAnnouncementEmail(student.email, exam);
      }
    }
  }

  return exam;
};

/**
 * Delete exam by id
 * @param {ObjectId} examId
 * @returns {Promise<Exam>}
 */
const deleteExamById = async (examId) => {
  const exam = await getExamById(examId);
  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }
  await exam.remove();
  return exam;
};

module.exports = {
  createExam,
  queryExams,
  getExamById,
  updateExamById,
  deleteExamById,
};

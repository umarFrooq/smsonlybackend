const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const examService = require('./exam.service');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createExam = catchAsync(async (req, res) => {
  const exam = await examService.createExam(req.body, req.user);
  res.status(httpStatus.CREATED).send(exam);
});

const getExams = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'session', 'gradeId', 'gradeIds', 'schoolId']);
  if (filter.gradeId === '') {
    delete filter.gradeId;
  }
  if (filter.gradeIds === '') {
    delete filter.gradeIds;
  }
  if (filter.name === '') {
    delete filter.name;
  }
  if (filter.session === '') {
    delete filter.session;
  }
  filter.schoolId = req.user.schoolId;
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await examService.queryExams(filter, options);
  // Normalize date fields in results so frontend always gets an ISO string and a display string
  try {
    if (result && Array.isArray(result.results)) {
      result.results = result.results.map((exam) => {
        // exam may be a Mongoose document or plain object
        const obj = (exam && typeof exam.toObject === 'function') ? exam.toObject() : { ...exam };
        if (obj.date) {
          const d = new Date(obj.date);
          if (!Number.isNaN(d.getTime())) {
            obj.date = d.toISOString();
            obj.dateDisplay = d.toLocaleDateString();
          } else {
            obj.dateDisplay = '';
          }
        } else {
          obj.dateDisplay = '';
        }
        return obj;
      });
    }
  } catch (e) {
    console.error('Failed to normalize exam dates', e);
  }

  // Prevent clients from using stale cached responses (e.g., 304 Not Modified)
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  } catch (e) {
    // ignore header set failures
  }
  res.send(result);
});

const getExam = catchAsync(async (req, res) => {
  const exam = await examService.getExamById(req.params.examId);
  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }
  res.send(exam);
});

const updateExam = catchAsync(async (req, res) => {
  const exam = await examService.updateExamById(req.params.examId, req.body);
  // Do NOT auto-create datesheets here. Creation is manual and must be triggered
  // by authorized users via the DateSheet management endpoint.
  res.send(exam);
});

const deleteExam = catchAsync(async (req, res) => {
  await examService.deleteExamById(req.params.examId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
};

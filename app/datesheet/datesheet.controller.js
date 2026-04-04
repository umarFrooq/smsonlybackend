const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const dateSheetService = require('./datesheet.service');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createDateSheet = catchAsync(async (req, res) => {
  const dateSheet = await dateSheetService.createDateSheet(req.body,req.user);
  res.status(httpStatus.CREATED).send(dateSheet);
});

const getDateSheets = catchAsync(async (req, res) => {
  // Accept examId, gradeId, branchId, subject and status (subject can be free-text or id)
  // Include `status` so clients can request non-default statuses (e.g. status=all)
  const filter = pick(req.query, ['examId', 'gradeId', 'branchId', 'subject', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await dateSheetService.queryDateSheets(filter, options, req.user);
  res.send(result);
});

const getDateSheet = catchAsync(async (req, res) => {
  const dateSheet = await dateSheetService.getDateSheetById(req.params.dateSheetId);
  if (!dateSheet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'DateSheet not found');
  }
  res.send(dateSheet);
});

const updateDateSheet = catchAsync(async (req, res) => {
  const dateSheet = await dateSheetService.updateDateSheetById(req.params.dateSheetId, req.body);
  res.send(dateSheet);
});

const deleteDateSheet = catchAsync(async (req, res) => {
  await dateSheetService.deleteDateSheetById(req.params.dateSheetId);
  res.status(httpStatus.NO_CONTENT).send();
});

const createDateSheetsForExam = catchAsync(async (req, res) => {
  const { examId } = req.body || {};
  if (!examId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'examId is required');
  }
  // Load exam and pass to service
  const examService = require('../exam/exam.service');
  const exam = await examService.getExamById(examId);
  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }
  const stats = await dateSheetService.createDateSheetsForExam(exam, req.user);
  res.send({ stats });
});

const downloadDateSheetsHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['examId', 'gradeId', 'branchId', 'subject', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  options.limit = 1000;
  const result = await dateSheetService.queryDateSheets(filter, options, req.user);
  const dateSheets = result.results || result;

  // Try to load exam info if examId provided
  let exam = null;
  if (filter.examId) {
    const examService = require('../exam/exam.service');
    try { exam = await examService.getExamById(filter.examId); } catch (e) { /* ignore */ }
  }

  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=datesheets_${filter.examId || 'all'}.pdf`,
  });

  const { buildDateSheetsPDF } = require('./pdf.service');
  buildDateSheetsPDF((chunk) => res.write(chunk), () => res.end(), dateSheets, exam);
});

module.exports = {
    createDateSheet,
    getDateSheets,
    getDateSheet,
    updateDateSheet,
  deleteDateSheet,
  createDateSheetsForExam,
  downloadDateSheetsHandler,
};

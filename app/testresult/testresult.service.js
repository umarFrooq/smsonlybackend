const httpStatus = require('http-status');
const  TestResult  = require('./testresult.model'); // Assuming TestResult model is exported from index.js
const Test = require('../test/test.model'); // Adjust path as needed
const User = require('../user/user.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
// const { deleteFromS3 } = require('../../config/s3.file.system'); // Assuming S3 delete utility exists
const { uploadToS3, deleteFromS3 } = require("../../config/upload-to-s3");

/**
 * Create a test result
 * @param {Object} resultBody - Basic result data (testId, studentId, obtainedMarks, comments)
 * @param {ObjectId} userId - ID of the user marking the result (markedBy)
 * @param {Object} resultBody - Basic result data (testId, studentId, obtainedMarks, comments)
 * @param {ObjectId} schoolId - The ID of the school
 * @param {ObjectId} userId - ID of the user marking the result (markedBy)
 * @param {any} [files] - Optional files object, e.g., from multer
 * @returns {Promise<TestResult>}
 */
const createTestResult = async (resultBody, schoolId, userId, files) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  const { testId, studentId, obtainedMarks } = resultBody;

  if (files && files.testSheet && files.testSheet.length > 0) { // Assuming 'testSheet' is the field name for the file
    resultBody.answerSheetImage = files.testSheet[0].location; // S3 location
  }

  const test = await Test.findOne({ _id: testId, schoolId });
  if (!test) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found in this school.');
  }

  const student = await User.findOne({ _id: studentId, schoolId });
  if (!student || !['student', 'user'].includes(student.role)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found in this school or is not a valid student.');
  }

  if (obtainedMarks > test.totalMarks) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Obtained marks (${obtainedMarks}) cannot exceed test's total marks (${test.totalMarks}).`);
  }

  const testResultPayload = {
    ...resultBody,
    schoolId, // Add schoolId
    gradeId: test.gradeId,
    branchId: test.branchId,
    totalMarksAtTimeOfTest: test.totalMarks,
    markedBy: userId,
  };

  try {
    const testResult = await TestResult.create(testResultPayload);
    return testResult;
  } catch (error) {
     if (error.code === 11000 || (error.message && error.message.includes("duplicate key error")) ) {
      throw new ApiError(httpStatus.CONFLICT, 'Result for this student and test already exists in this school.');
    }
    throw error;
  }
};

/**
 * Query for test results
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<QueryResult>}
 */
const queryTestResults = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query test results.');
  }
  const schoolScopedFilter = { ...filter, schoolId };
  
  const testResults = await TestResult.paginate(schoolScopedFilter, options);
  return testResults;
};

/**
 * Get test result by id
 * @param {ObjectId} resultId - Result ID
 * @param {ObjectId} schoolId - School ID
 * @param {String} [populateOptionsStr] - Comma separated string of fields to populate
 * @returns {Promise<TestResult>}
 */
const getTestResultById = async (resultId, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  let query = TestResult.findOne({ _id: resultId, schoolId });
  
  if (populateOptionsStr) {
    populateOptionsStr.split(',').forEach(popField => {
      const [path, select] = popField.trim().split(':');
      if (select) {
        query = query.populate({ path, select });
      } else {
        query = query.populate(path);
      }
    });
  } else { // Default population
    query = query.populate('testId', 'title subjectId')
                 .populate('studentId', 'fullname email')
                 .populate('gradeId', 'title')
                 .populate('branchId', 'name')
                 .populate('markedBy', 'fullname');
  }

  const testResult = await query.exec();
  if (!testResult) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test result not found or not associated with this school.');
  }
  return testResult;
};

/**
 * Update test result by id
 * @param {ObjectId} resultId - Result ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID
 * @param {ObjectId} userId - ID of the user performing the update
 * @param {any} [files] - Optional files object for new answer sheet
 * @returns {Promise<TestResult>}
 */
const updateTestResultById = async (resultId, updateBody, schoolId, userId, files) => {
  const testResult = await getTestResultById(resultId, schoolId); // Ensures result belongs to school

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a test result.');
  }
  delete updateBody.schoolId;

  let newImagePath = files && files.testSheet && files.testSheet.length ? files.testSheet[0].location : undefined;

  if (updateBody.deleteImage === 'true' || updateBody.deleteImage === true) { // Handle string 'true' or boolean true
    if (testResult.answerSheetImage) {
      try {
        await deleteFromS3(testResult.answerSheetImage);
        updateBody.answerSheetImage = null; // Explicitly set to null if deleted
      } catch (s3Error) {
        console.error(`Failed to delete old image from S3: ${testResult.answerSheetImage}`, s3Error);
      }
    }
    delete updateBody.deleteImage; // remove from updateBody
  }

  if (newImagePath) { // If a new image is uploaded
      if (testResult.answerSheetImage && testResult.answerSheetImage !== newImagePath) { // Delete old if exists and different
          try {
              await deleteFromS3(testResult.answerSheetImage);
          } catch (s3Error) {
              console.error(`Failed to delete old image from S3: ${testResult.answerSheetImage}`, s3Error);
          }
      }
      updateBody.answerSheetImage = newImagePath;
  }


  if (updateBody.obtainedMarks !== undefined && updateBody.obtainedMarks > testResult.totalMarksAtTimeOfTest) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Obtained marks (${updateBody.obtainedMarks}) cannot exceed test's total marks (${testResult.totalMarksAtTimeOfTest}).`);
  }
  
  Object.assign(testResult, updateBody, { markedBy: userId });
  await testResult.save();
  return testResult;
};

/**
 * Delete test result by id
 * @param {ObjectId} resultId - Result ID
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<TestResult>}
 */
const deleteTestResultById = async (resultId, schoolId) => {
  const testResult = await getTestResultById(resultId, schoolId); // Ensures result belongs to school

  const imagePath = testResult.answerSheetImage;
  await testResult.remove();

  if (imagePath) {
    try {
      await deleteFromS3(imagePath);
    } catch (s3Error) {
      console.error(`Failed to delete image from S3 during result deletion: ${imagePath}`, s3Error);
    }
  }
  return testResult;
};

module.exports = {
  createTestResult,
  queryTestResults,
  getTestResultById,
  updateTestResultById,
  deleteTestResultById,
};

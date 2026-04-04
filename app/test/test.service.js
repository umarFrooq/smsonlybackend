const httpStatus = require('http-status');
const { Test } = require('.'); // Assuming Test model is exported from index.js
const Subject = require('../subject/subject.model'); // Adjust path as needed
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');

/**
 * Helper to validate related entities for a test against a given schoolId
 * @param {Object} testBody - Contains subjectId, gradeId, branchId, section
 * @param {ObjectId} schoolId - The schoolId to validate against
 */
const validateTestEntities = async (testBody, schoolId) => {
  const { subjectId, gradeId, branchId, section } = testBody;

  if (!schoolId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'School context is missing for validation.');
  }

  const subject = await Subject.findOne({ _id: subjectId, schoolId });
  if (!subject) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Subject with ID ${subjectId} not found in this school.`);
  }

  const grade = await Grade.findOne({ _id: gradeId, schoolId });
  if (!grade) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Grade with ID ${gradeId} not found in this school.`);
  }

  const branch = await Branch.findOne({ _id: branchId, schoolId });
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found in this school.`);
  }

  // Validate section if provided
  if (section && !grade.sections.map(s=>s.toUpperCase()).includes(section.toUpperCase())) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Section ${section} not found in Grade ${grade.title} for this school.`);
  }

  // Ensure all entities belong to the same branch (which itself belongs to the school)
  if (subject.branchId.toString() !== branchId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Subject ${subject.title} does not belong to the specified branch ${branch.name}.`);
  }
  const gradeBranchId = grade.branchId._id ? grade.branchId._id.toString() : grade.branchId.toString();
  if (gradeBranchId !== branchId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Grade ${grade.title} does not belong to the specified branch ${branch.name}.`);
  }
};

/**
 * Create a test
 * @param {Object} testData - Data for the test
 * @param {ObjectId} schoolId - The ID of the school
 * @param {ObjectId} userId - ID of the user creating the test
 * @returns {Promise<Test>}
 */
const createTest = async (testData, schoolId, userId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to create a test.');
  }
  await validateTestEntities(testData, schoolId);
  
  if (testData.passingMarks !== undefined && testData.totalMarks !== undefined && testData.passingMarks > testData.totalMarks) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Passing marks cannot be greater than total marks.');
  }

  const testPayload = { ...testData, schoolId, createdBy: userId };
  const test = await Test.create(testPayload);
  return test;
};

/**
 * Query for tests
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<QueryResult>}
 */
const queryTests = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query tests.');
  }
  const schoolScopedFilter = { ...filter, schoolId };

  // Handle date range queries
  if (schoolScopedFilter.startDate && schoolScopedFilter.endDate) {
    schoolScopedFilter.date = { $gte: new Date(schoolScopedFilter.startDate), $lte: new Date(schoolScopedFilter.endDate) };
    delete schoolScopedFilter.startDate;
    delete schoolScopedFilter.endDate;
  } else if (schoolScopedFilter.startDate) {
    schoolScopedFilter.date = { $gte: new Date(schoolScopedFilter.startDate) };
    delete schoolScopedFilter.startDate;
  } else if (schoolScopedFilter.endDate) {
    schoolScopedFilter.date = { $lte: new Date(schoolScopedFilter.endDate) };
    delete schoolScopedFilter.endDate;
  }
  
  // Assuming standard mongoose-paginate-v2 options.populate usage
  const tests = await Test.paginate(schoolScopedFilter, options);
  return tests;
};

/**
 * Get test by id
 * @param {ObjectId} id - Test ID
 * @param {ObjectId} schoolId - School ID
 * @param {String} [populateOptionsStr] - Comma separated string of fields to populate
 * @returns {Promise<Test>}
 */
const getTestById = async (id, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  let query = Test.findOne({ _id: id, schoolId });

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
    query = query.populate('subjectId', 'title')
                 .populate('gradeId', 'title')
                 .populate('branchId', 'name')
                 .populate('createdBy', 'fullname');
  }
  const test = await query.exec();
  if (!test) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found or not associated with this school.');
  }
  return test;
};

/**
 * Update test by id
 * @param {ObjectId} testId - Test ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Test>}
 */
const updateTestById = async (testId, updateBody, schoolId) => {
  const test = await getTestById(testId, schoolId); // Ensures test belongs to school

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a test.');
  }
  delete updateBody.schoolId;

  // If related entities are being updated, validate them against the current schoolId
  if (updateBody.subjectId || updateBody.gradeId || updateBody.branchId || updateBody.hasOwnProperty('section')) {
    const tempTestBodyForValidation = {
        subjectId: updateBody.subjectId || test.subjectId,
        gradeId: updateBody.gradeId || test.gradeId,
        branchId: updateBody.branchId || test.branchId,
        section: updateBody.section !== undefined ? updateBody.section : test.section,
    };
    await validateTestEntities(tempTestBodyForValidation, schoolId);
  }
  
  const totalMarks = updateBody.totalMarks !== undefined ? updateBody.totalMarks : test.totalMarks;
  const passingMarks = updateBody.passingMarks !== undefined ? updateBody.passingMarks : test.passingMarks;

  if (passingMarks !== undefined && totalMarks !== undefined && passingMarks > totalMarks) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Passing marks cannot be greater than total marks.');
  }

  Object.assign(test, updateBody);
  await test.save();
  return test;
};

/**
 * Delete test by id
 * @param {ObjectId} testId - Test ID
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Test>}
 */
const deleteTestById = async (testId, schoolId) => {
  const test = await getTestById(testId, schoolId); // Ensures test belongs to school
  // Add any pre-delete checks, e.g., if results are associated with this test
  await test.remove();
  return test;
};

module.exports = {
  createTest,
  queryTests,
  getTestById,
  updateTestById,
  deleteTestById,
};

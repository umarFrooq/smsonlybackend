const httpStatus = require('http-status');
const  Grade  = require('./grade.model'); // Assuming Grade model is exported from index.js
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');

/**
 * Create a grade
 * @param {Object} gradeData - Data for the grade
 * @param {ObjectId} schoolId - The ID of the school this grade belongs to
 * @returns {Promise<Grade>}
 */
const createGrade = async (gradeData, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to create a grade.');
  }
  // Verify branchId belongs to the school
  const branch = await Branch.findOne({ _id: gradeData.branchId, schoolId });
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Branch not found or does not belong to this school.');
  }

  if (gradeData.levelCode && await Grade.isLevelCodeTakenInSchool(gradeData.levelCode, schoolId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Level code already taken for this school.');
  }

  if (gradeData.nextGradeId) {
    const nextGrade = await Grade.findOne({ _id: gradeData.nextGradeId, schoolId });
    if (!nextGrade) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'NextGradeId not found or does not belong to this school.');
    }
  }

  const gradePayload = { ...gradeData, schoolId };
  return Grade.create(gradePayload);
};

/**
 * Query for grades
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} [schoolId] - Optional: The ID of the school for filtering. Mandatory for non-root users.
 * @param {String} [userRole] - Optional: Role of the user making the request.
 * @returns {Promise<QueryResult>}
 */
const queryGrades = async (filter, options, schoolId, userRole) => {
  let queryFilter = { ...filter };

  if (userRole !== 'rootUser') {
    if (!schoolId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School ID context is required for your role to query grades.');
    }
    queryFilter.schoolId = schoolId;
  } else if (schoolId) { // rootUser provided a specific schoolId
    queryFilter.schoolId = schoolId;
  }
  // If rootUser and no schoolId, lists all grades across all schools.

  const grades = await Grade.paginate(queryFilter, options);
  return grades;
};


/**
 * Get grade by id
 * @param {ObjectId} id - Grade ID
 * @param {ObjectId} [schoolId] - Optional: School ID for scoping. Mandatory for non-root users.
 * @param {String} [userRole] - Optional: Role of the user.
 * @param {String} [populateOptionsStr] - Comma separated string of fields to populate.
 * @returns {Promise<Grade>}
 */
const getGradeById = async (id, schoolId, userRole, populateOptionsStr) => {
  let mongoQuery = {};
  if (userRole === 'rootUser') {
    mongoQuery._id = id;
    if (schoolId) { // rootUser can optionally scope to a school
      mongoQuery.schoolId = schoolId;
    }
  } else { // Non-root users must be scoped
    if (!schoolId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School ID context is required for your role to get a grade.');
    }
    mongoQuery = { _id: id, schoolId };
  }

  let findQuery = Grade.findOne(mongoQuery);
  if (populateOptionsStr) {
    populateOptionsStr.split(',').forEach(populateOption => {
        const [path, select] = populateOption.trim().split(':');
        if (select) { findQuery = findQuery.populate({ path, select }); }
        else { findQuery = findQuery.populate(path); }
    });
  }
  const grade = await findQuery.exec();

  if (!grade) {
    const message = (userRole !== 'rootUser' || schoolId) // If scoped or was intended to be scoped
      ? 'Grade not found or not associated with the specified school.'
      : 'Grade not found.';
    throw new ApiError(httpStatus.NOT_FOUND, message);
  }
  return grade;
};

/**
 * Update grade by id
 * @param {ObjectId} gradeId - Grade ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID (mandatory: operation is always on a specific school's grade)
 * @param {String} userRole - Role of the user performing update (for getGradeById call)
 * @returns {Promise<Grade>}
 */
const updateGradeById = async (gradeId, updateBody, schoolId, userRole) => {
  if (!schoolId) { // Should be provided by controller for both root and superadmin
    throw new ApiError(httpStatus.BAD_REQUEST, 'Target School ID is required to update a grade.');
  }
  // Fetch grade ensuring it belongs to the target schoolId, respecting root's ability to specify any schoolId
  const grade = await getGradeById(gradeId, schoolId, userRole, null);

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a grade via this operation.');
  }
  delete updateBody.schoolId;

  if (updateBody.branchId && updateBody.branchId.toString() !== grade.branchId.toString()) {
    const newBranch = await Branch.findOne({ _id: updateBody.branchId, schoolId }); // branch must be in same school
    if (!newBranch) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'New branch not found or does not belong to this school.');
    }
  }
  
  if (updateBody.levelCode && (await Grade.isLevelCodeTakenInSchool(updateBody.levelCode, schoolId, gradeId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Level code already taken for this school.');
  }

  if (updateBody.nextGradeId) {
    const nextGrade = await Grade.findOne({ _id: updateBody.nextGradeId, schoolId }); // nextGrade must be in same school
    if (!nextGrade) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'NextGradeId not found or does not belong to this school.');
    }
  }

  Object.assign(grade, updateBody);
  await grade.save();
  return grade;
};

/**
 * Delete grade by id
 * @param {ObjectId} gradeId - Grade ID
 * @param {ObjectId} schoolId - School ID (mandatory)
 * @param {String} userRole - Role of the user performing delete
 * @returns {Promise<Grade>}
 */
const deleteGradeById = async (gradeId, schoolId, userRole) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Target School ID is required to delete a grade.');
  }
  const grade = await getGradeById(gradeId, schoolId, userRole, null);
  await grade.remove();
  return grade;
};

/**
 * Add a section to a grade
 * @param {ObjectId} gradeId - Grade ID
 * @param {string} sectionName - Name of the section
 * @param {ObjectId} schoolId - School ID (mandatory)
 * @param {String} userRole - Role of the user
 * @returns {Promise<Grade>}
 */
const addSectionToGrade = async (gradeId, sectionName, schoolId, userRole) => {
  if (!schoolId) throw new ApiError(httpStatus.BAD_REQUEST, 'Target School ID is required.');
  const grade = await getGradeById(gradeId, schoolId, userRole, null);
  const upperSectionName = sectionName.toUpperCase().trim();
  if (grade.sections.includes(upperSectionName)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Section already exists in this grade.');
  }
  grade.sections.push(upperSectionName);
  await grade.save();
  return grade;
};

/**
 * Remove a section from a grade
 * @param {ObjectId} gradeId - Grade ID
 * @param {string} sectionName - Name of the section
 * @param {ObjectId} schoolId - School ID (mandatory)
 * @param {String} userRole - Role of the user
 * @returns {Promise<Grade>}
 */
const removeSectionFromGrade = async (gradeId, sectionName, schoolId, userRole) => {
  if (!schoolId) throw new ApiError(httpStatus.BAD_REQUEST, 'Target School ID is required.');
  const grade = await getGradeById(gradeId, schoolId, userRole, null);
  const upperSectionName = sectionName.toUpperCase().trim();
  if (!grade.sections.includes(upperSectionName)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Section not found in this grade.');
  }
  grade.sections = grade.sections.filter((s) => s !== upperSectionName);
  await grade.save();
  return grade;
};

/**
 * Update/Replace all sections in a grade
 * @param {ObjectId} gradeId - Grade ID
 * @param {string[]} sectionsArray - Array of new section names
 * @param {ObjectId} schoolId - School ID (mandatory)
 * @param {String} userRole - Role of the user
 * @returns {Promise<Grade>}
 */
const updateSectionsInGrade = async (gradeId, sectionsArray, schoolId, userRole) => {
  if (!schoolId) throw new ApiError(httpStatus.BAD_REQUEST, 'Target School ID is required.');
  const grade = await getGradeById(gradeId, schoolId, userRole, null);
  // Ensure uniqueness and uppercase for the incoming array
  const uniqueSections = [...new Set(sectionsArray.map(s => s.toUpperCase().trim()))];
  grade.sections = uniqueSections;
  await grade.save();
  return grade;
};


module.exports = {
  createGrade,
  queryGrades,
  getGradeById,
  updateGradeById,
  deleteGradeById,
  addSectionToGrade,
  removeSectionFromGrade,
  updateSectionsInGrade,
};

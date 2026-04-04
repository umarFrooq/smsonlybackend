const httpStatus = require('http-status');
const { Paper } = require('./paper.model'); // Assuming Paper model is exported from index.js
const Subject = require('../subject/subject.model'); // Adjust path as needed
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
const { deleteFromS3 } = require('../../config/s3.file.system'); // Assuming S3 delete utility exists

/**
 * Helper to validate related entities for a paper against a given schoolId
 * @param {Object} paperBody - Contains subjectId, gradeId, branchId
 * @param {ObjectId} schoolId - The schoolId to validate against
 */
const validatePaperEntities = async (paperBody, schoolId) => {
  const { subjectId, gradeId, branchId } = paperBody;

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
 * Create a paper (upload paper)
 * @param {Object} paperData - Basic paper data (title, subjectId, gradeId, etc.)
 * @param {ObjectId} schoolId - The ID of the school
 * @param {ObjectId} userId - ID of the user uploading the paper (uploadedBy)
 * @param {string} fileUrl - URL of the uploaded paper file from S3
 * @returns {Promise<Paper>}
 */
const uploadPaper = async (paperData, schoolId, userId, fileUrl) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to upload a paper.');
  }
  await validatePaperEntities(paperData, schoolId);

  const payload = {
    ...paperData,
    schoolId, // Add schoolId
    paperFileUrl: fileUrl,
    uploadedBy: userId,
  };

  const paper = await Paper.create(payload);
  return paper;
};

/**
 * Query for papers
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<QueryResult>}
 */
const queryPapers = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query papers.');
  }
  const schoolScopedFilter = { ...filter, schoolId };
  
  // Assuming standard mongoose-paginate-v2 options.populate usage
  const papers = await Paper.paginate(schoolScopedFilter, options);
  return papers;
};

/**
 * Get paper by id
 * @param {ObjectId} paperId - Paper ID
 * @param {ObjectId} schoolId - School ID
 * @param {String} [populateOptionsStr] - Comma separated string of fields to populate
 * @returns {Promise<Paper>}
 */
const getPaperById = async (paperId, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  let query = Paper.findOne({ _id: paperId, schoolId });

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
                 .populate('uploadedBy', 'fullname');
  }
  const paper = await query.exec();
  if (!paper) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Paper not found or not associated with this school.');
  }
  return paper;
};

/**
 * Update paper by id
 * @param {ObjectId} paperId - Paper ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID
 * @param {ObjectId} userId - ID of the user performing the update
 * @param {string} [newFileUrl] - Optional new URL for the paper file
 * @returns {Promise<Paper>}
 */
const updatePaperById = async (paperId, updateBody, schoolId, userId, newFileUrl) => {
  const paper = await getPaperById(paperId, schoolId); // Ensures paper belongs to school

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a paper.');
  }
  delete updateBody.schoolId;

  // If related entities are being updated, validate them against the current schoolId
  if (updateBody.subjectId || updateBody.gradeId || updateBody.branchId) {
    const tempPaperBodyForValidation = {
        subjectId: updateBody.subjectId || paper.subjectId,
        gradeId: updateBody.gradeId || paper.gradeId,
        branchId: updateBody.branchId || paper.branchId,
    };
    await validatePaperEntities(tempPaperBodyForValidation, schoolId);
  }
  
  const oldFileUrl = paper.paperFileUrl;
  Object.assign(paper, updateBody, { uploadedBy: userId });

  if (newFileUrl !== undefined) {
    paper.paperFileUrl = newFileUrl; // newFileUrl can be null if file is removed & schema allows
    if (oldFileUrl && newFileUrl !== oldFileUrl) {
      try {
        await deleteFromS3(oldFileUrl);
      } catch (s3Error) {
        console.error(`Failed to delete old paper file from S3: ${oldFileUrl}`, s3Error);
      }
    }
  }
  // Note: If paperFileUrl is required in schema and newFileUrl is null, save will fail.
  // This logic assumes controller handles file upload and provides newFileUrl correctly.

  await paper.save();
  return paper;
};

/**
 * Delete paper by id
 * @param {ObjectId} paperId - Paper ID
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Paper>}
 */
const deletePaperById = async (paperId, schoolId) => {
  const paper = await getPaperById(paperId, schoolId); // Ensures paper belongs to school

  const fileUrl = paper.paperFileUrl;
  await paper.remove();

  if (fileUrl) {
    try {
      await deleteFromS3(fileUrl);
    } catch (s3Error) {
      console.error(`Failed to delete paper file from S3 during paper deletion: ${fileUrl}`, s3Error);
    }
  }
  return paper;
};

module.exports = {
  uploadPaper,
  queryPapers,
  getPaperById,
  updatePaperById,
  deletePaperById,
};

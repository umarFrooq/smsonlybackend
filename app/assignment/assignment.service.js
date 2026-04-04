const httpStatus = require('http-status');
const Assignment = require('./assignment.model');
const Submission = require('./submission.model'); // Needed for delete logic
const Subject = require('../subject/subject.model'); // Assuming path
const Grade = require('../grade/grade.model'); // Assuming path
const Branch = require('../branch/branch.model'); // Assuming path
const ApiError = require('../../utils/ApiError');
const pick = require('../../utils/pick');
const { getStudentIdsByGradeAndSection } = require('../user/user.service'); // Placeholder for fetching students

/**
 * Create an assignment
 * @param {Object} assignmentBody - Data for the assignment
 * @param {Object} user - The user creating the assignment (teacher)
 * @param {ObjectId} [schoolIdForRoot] - School ID, required if user is rootAdmin
 * @returns {Promise<Assignment>}
 */
const createAssignment = async (assignmentBody, user, schoolIdForRoot) => {
  const schoolId = user.role === 'rootUser' ? schoolIdForRoot : user.schoolId;
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to create an assignment.');
  }

  // Verify subject, grade, and branch belong to the school
  const subject = await Subject.findOne({ _id: assignmentBody.subjectId, schoolId });
  if (!subject) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subject not found or does not belong to this school.');
  }

  const grade = await Grade.findOne({ _id: assignmentBody.gradeId, schoolId });
  if (!grade) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Grade not found or does not belong to this school.');
  }

  const branch = await Branch.findOne({ _id: assignmentBody.branchId, schoolId });
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Branch not found or does not belong to this school.');
  }
  // Ensure the grade belongs to the branch
  if (grade.branchId._id.toString() != branch._id.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Grade does not belong to the specified branch.');
  }


  if (await Assignment.isTitleTaken(assignmentBody.title, user._id, assignmentBody.subjectId, assignmentBody.gradeId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Assignment title already taken for this subject and grade by you.');
  }

  const assignmentPayload = {
    ...assignmentBody,
    teacherId: user.id,
    schoolId,
  };
  return Assignment.create(assignmentPayload);
};

/**
 * Query for assignments
 * @param {Object} filterParams - Filter parameters from request query
 * @param {Object} options - Query options (limit, page, sortBy, populate)
 * @param {Object} user - The user making the request
 * @returns {Promise<QueryResult>}
 */
const queryAssignments = async (filterParams, options, user) => {
  const queryFilter = {};

  // Apply base filters from the request
  if (filterParams.title) queryFilter.title = { $regex: filterParams.title, $options: 'i' };
  if (filterParams.subjectId) queryFilter.subjectId = filterParams.subjectId;
  if (filterParams.gradeId) queryFilter.gradeId = filterParams.gradeId;
  if (filterParams.branchId) queryFilter.branchId = filterParams.branchId;
  if (filterParams.teacherId) queryFilter.teacherId = filterParams.teacherId;
  if (filterParams.status) queryFilter.status = filterParams.status;
  if (filterParams.schoolId) queryFilter.schoolId = filterParams.schoolId;


  // Role-based access control adjustments
  if (user.role === 'student') {
    if (!user.gradeId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not assigned to any grade to view assignments.');
    }
    queryFilter.gradeId = user.gradeId; // Enforce student's grade
    queryFilter.status = 'published';   // Students only see published assignments
  } else if (user.role === 'teacher') {
    queryFilter.teacherId = user._id; // Teachers only see their own assignments
    queryFilter.schoolId = user.schoolId;
  } else if (user.role === 'admin' || user.role === 'branchAdmin') {
    queryFilter.schoolId = user.schoolId;
    if (user.role === 'branchAdmin' && user.branchId) {
      queryFilter.branchId = user.branchId; // Branch admin sees assignments for their branch
    }
  }
  // rootUser can see all assignments without restriction, so no specific filter is needed unless one is provided.

  // Date filtering
  if (filterParams.dueDateFrom || filterParams.dueDateTo) {
    queryFilter.dueDate = {};
    if (filterParams.dueDateFrom) {
      queryFilter.dueDate.$gte = new Date(filterParams.dueDateFrom);
    }
    if (filterParams.dueDateTo) {
      queryFilter.dueDate.$lte = new Date(filterParams.dueDateTo);
    }
  }
  const assignments = await Assignment.paginate(queryFilter, options);
  return assignments;
};

/**
 * Get assignment by ID
 * @param {ObjectId} assignmentId
 * @param {Object} user - The user making the request
 * @returns {Promise<Assignment>}
 */
const getAssignmentById = async (assignmentId, user, populateOptionsStr) => {
  let mongoQuery = { _id: assignmentId };

  if (user.role === 'student') {
    if (!user.gradeId) throw new ApiError(httpStatus.NOT_FOUND, 'Assignment not found or not accessible.');
    mongoQuery.gradeId = user.gradeId;
    mongoQuery.status = 'published'; // Students can only access published assignments
  } else if (user.role === 'teacher') {
    mongoQuery.schoolId = user.schoolId;
    // A teacher should be able to get any assignment in their school if needed for reference,
    // but typically they'd interact most with their own.
    // mongoQuery.teacherId = user._id; // Uncomment if teachers can ONLY see their own
  } else if (user.role === 'admin' || user.role === 'branchAdmin') {
    mongoQuery.schoolId = user.schoolId;
    if (user.role === 'branchAdmin' && user.branchId) {
        mongoQuery.branchId = user.branchId;
    }
  } else if (user.role !== 'rootUser') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view this assignment.');
  }
  // rootUser has no school/grade restrictions here

  let findQuery = Assignment.findOne(mongoQuery);
  if (populateOptionsStr) {
    populateOptionsStr.split(',').forEach(populateOption => {
        const [path, select] = populateOption.trim().split(':');
        if (select) { findQuery = findQuery.populate({ path, select }); }
        else { findQuery = findQuery.populate(path); }
    });
  }
  const assignment = await findQuery.exec();


  if (!assignment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Assignment not found or not accessible.');
  }
  return assignment;
};

/**
 * Update assignment by ID
 * @param {ObjectId} assignmentId
 * @param {Object} updateBody
 * @param {Object} user - The user making the request (teacher)
 * @returns {Promise<Assignment>}
 */
const updateAssignmentById = async (assignmentId, updateBody, user) => {
  const assignment = await getAssignmentById(assignmentId, user); // Ensures teacher owns or has access

  if (assignment.teacherId.toString() !== user._id.toString() && user.role === 'teacher') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own assignments.');
  }
  // Admins/rootUser could update, but this service is scoped for teachers primarily.
  // More complex role checks could be added if admins need to edit any assignment.

  // Prevent changing school/branch/grade/subject if submissions exist? Or teacher?
  // For simplicity, current validation allows changing some fields.
  // More restrictive logic can be added based on requirements.

  if (updateBody.title && updateBody.title !== assignment.title) {
    if (await Assignment.isTitleTaken(updateBody.title, assignment.teacherId, assignment.subjectId, assignment.gradeId, assignmentId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Assignment title already taken for this subject and grade by you.');
    }
  }

  // If subjectId, gradeId, or branchId are being updated, re-verify they belong to the assignment's schoolId
  if (updateBody.subjectId && updateBody.subjectId.toString() !== assignment.subjectId._id.toString()) {
    const subject = await Subject.findOne({ _id: updateBody.subjectId, schoolId: assignment.schoolId });
    if (!subject) throw new ApiError(httpStatus.BAD_REQUEST, 'New subject not found or does not belong to this school.');
  }
  if (updateBody.gradeId && updateBody.gradeId.toString() !== assignment.gradeId._id.toString()) {
    const grade = await Grade.findOne({ _id: updateBody.gradeId, schoolId: assignment.schoolId });
    if (!grade) throw new ApiError(httpStatus.BAD_REQUEST, 'New grade not found or does not belong to this school.');
     // If grade changes, ensure it's compatible with the branch
    if (grade.branchId.toString() !== assignment.branchId._id.toString()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'The new grade does not belong to the assignment\'s current branch.');
    }
  }
  // Note: Changing branchId might imply changing gradeId too, or complex validation.
  // For now, we assume grade's branch must match assignment's branch. Teacher cannot change assignment's branchId directly.

  Object.assign(assignment, updateBody);
  await assignment.save();
  return assignment;
};

/**
 * Delete assignment by ID
 * @param {ObjectId} assignmentId
 * @param {Object} user - The user making the request (teacher or admin)
 * @returns {Promise<Assignment>}
 */
const deleteAssignmentById = async (assignmentId, user) => {
  const assignment = await getAssignmentById(assignmentId, user); // Ensures teacher owns or admin has access

  if (user.role === 'teacher' && assignment.teacherId.toString() !== user._id.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own assignments.');
  }
  // Add checks for admin/rootUser if they are allowed to delete.
  // For example, an admin might need schoolId scope.
  if ((user.role === 'admin' || user.role === 'branchAdmin') && assignment.schoolId.toString() !== user.schoolId.toString()){
      throw new ApiError(httpStatus.FORBIDDEN, 'You cannot delete assignments outside your school scope.');
  }
  if (user.role === 'branchAdmin' && user.branchId && assignment.branchId.toString() !== user.branchId.toString()){
      throw new ApiError(httpStatus.FORBIDDEN, 'You cannot delete assignments outside your branch scope.');
  }


  // Check for submissions before deleting?
  const submissionCount = await Submission.countDocuments({ assignmentId: assignment._id });
  if (submissionCount > 0) {
    // Option 1: Prevent deletion
    // throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete assignment with existing submissions. Please archive it instead or delete submissions first.');
    // Option 2: Soft delete/archive (by changing status) - current model has status
    assignment.status = 'archived'; // Or implement a soft delete plugin
    await assignment.save();
    // return { message: "Assignment archived due to existing submissions." }; // Or return the assignment
    // For now, let's proceed with actual deletion and note that submissions should be handled.
    // A more robust system would archive or require submissions to be deleted first.
    // For this exercise, we will delete related submissions.
    await Submission.deleteMany({ assignmentId: assignment._id });

  }

  await assignment.remove();
  return assignment; // Or return a success message
};


module.exports = {
  createAssignment,
  queryAssignments,
  getAssignmentById,
  updateAssignmentById,
  deleteAssignmentById,
};

const httpStatus = require('http-status');
const ApiError = require('./ApiError'); // Assuming ApiError is in the same directory or adjust path
const User = require('../app/user/user.model'); // Adjust path as per your structure
const Subject = require('../app/subject/subject.model'); // Adjust path
const Grade = require('../app/grade/grade.model'); // Adjust path
const Branch = require('../app/branch/branch.model'); // Adjust path
const School = require('../app/school/school.model'); // Adjust path

/**
 * Checks if related entities (School, Branch, Grade, Subject, Teacher) exist and are consistent.
 * Throws ApiError if any validation fails.
 * @param {ObjectId} schoolId
 * @param {ObjectId} branchId
 * @param {ObjectId} gradeId
 * @param {ObjectId} subjectId
 * @param {ObjectId} teacherId
 */
async function checkSchoolBranchGradeSubjectTeacherExist(schoolId, branchId, gradeId, subjectId, teacherId) {
  // 1. Check School
  const school = await School.findById(schoolId);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }

  // 2. Check Branch
  const branch = await Branch.findById(branchId);
  if (!branch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Branch not found');
  }
  if (branch.schoolId.toString() != schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Branch ${branch.name} does not belong to school ${school.name}`);
  }

  // 3. Check Grade
  const grade = await Grade.findById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }
  if (grade.schoolId.toString() != schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Grade ${grade.title} does not belong to school ${school.name}`);
  }
  if (grade.branchId._id.toString() != branchId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Grade ${grade.title} does not belong to branch ${branch.name}`);
  }

  // 4. Check Subject
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subject not found');
  }
  if (subject.schoolId.toString() != schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Subject ${subject.title} does not belong to school ${school.name}`);
  }

  // Assuming subjects might be branch-specific or school-wide. If branch-specific:
  // if (subject.branchId && subject.branchId.toString() != branchId.toString()) {
  //    throw new ApiError(httpStatus.BAD_REQUEST, `Subject ${subject.title} does not belong to branch ${branch.name}`);
  // }


  // 5. Check Teacher
  const teacher = await User.findById(teacherId);
  if (!teacher) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Teacher (User) not found');
  }
  if (teacher.role !== 'teacher') { // Assuming 'teacher' is the role identifier
    throw new ApiError(httpStatus.BAD_REQUEST, `User ${teacher.fullname} is not a teacher.`);
  }
  // Check if teacher belongs to the school. Assuming User model has a schoolId field.
  if (teacher.schoolId && teacher.schoolId._id.toString() != schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Teacher ${teacher.fullname} does not belong to school ${school.name}`);
  }
  // Optional: Check if teacher is assigned to the branch if your system has that granularity for teachers.
  // if (teacher.branchId && teacher.branchId.toString() !== branchId.toString()) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, `Teacher ${teacher.fullname} is not assigned to branch ${branch.name}`);
  // }
}

module.exports = {
  checkSchoolBranchGradeSubjectTeacherExist,
};

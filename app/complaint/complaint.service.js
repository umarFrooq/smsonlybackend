const httpStatus = require('http-status');
const { Complaint, complaintTypes, complaintStatuses, complaintPriorities } = require('./complaint.model');
const ApiError = require('../../utils/ApiError');
const { responseMethod } = require('../../utils/generalDB.methods.js/DB.methods');

/**
 * Create a complaint
 * @param {Object} complaintBody
 * @param {Object} user - The user creating the complaint
 * @returns {Promise<Object>}
 */
const createComplaint = async (complaintBody, user) => {
  try {
    // Set complainant information
    complaintBody.complainantId = user._id;
    complaintBody.complainantRole = user.role;
    complaintBody.schoolId = user.schoolId;
    complaintBody.branchId = user.branchId ? user.branchId :null
    // For students/parents, set studentId automatically
    if (user.role === 'student') {
      complaintBody.studentId = user._id;
      complaintBody.gradeId = user.gradeId;
    } else if (user.role === 'parent' && complaintBody.studentId) {
      // Verify the parent has access to this student
      const Student = require('../user/user.model');
      const student = await Student.findOne({ 
        _id: complaintBody.studentId, 
        schoolId: user.schoolId 
      });
      if (!student) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Student not found or not accessible');
      }
      complaintBody.gradeId = student.gradeId;
    }
    
    // Validate target exists based on complaint type
    await validateComplaintTarget(complaintBody, user);

    // Set visibility defaults: if complaint is against a teacher or student,
    // hide the complaint from that target by default. Admins will need to
    // approve visibility explicitly.
    complaintBody.visibleToTeacher = complaintBody.complaintType === complaintTypes.TEACHER ? false : true;
    complaintBody.visibleToStudent = complaintBody.complaintType === complaintTypes.STUDENT ? false : true;
    
    // Set priority based on urgency
    if (complaintBody.isUrgent) {
      complaintBody.priority = complaintPriorities.HIGH;
    }
    
    // Set due date (7 days from now for general complaints, 3 days for student-related)
    if (!complaintBody.dueDate) {
      const daysToAdd = complaintBody.complaintType === complaintTypes.STUDENT ? 3 : 7;
      complaintBody.dueDate = new Date(Date.now() + (daysToAdd * 24 * 60 * 60 * 1000));
    }
    
    const complaint = await Complaint.create(complaintBody);
    
    // Populate the created complaint
    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('complainantId', 'fullname email role')
      .populate('targetTeacherId', 'fullname email')
      .populate('targetStudentId', 'fullname email')
      .populate('targetSubjectId', 'name')
      .populate('schoolId', 'name')
      .populate('branchId', 'name');
    
    // Send notifications (admins always, targets only if visible)
    await sendComplaintNotifications(populatedComplaint);
    
    return responseMethod(201, true, 'Complaint created successfully', populatedComplaint);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Validate complaint target based on type
 */
const validateComplaintTarget = async (complaintBody, user) => {
  const User = require('../user/user.model');
  const Subject = require('../subject/subject.model');
  const Branch = require('../branch/branch.model');
  const Grade = require('../grade/grade.model');
  
  switch (complaintBody.complaintType) {
    case complaintTypes.TEACHER:
      const teacher = await User.findOne({ 
        _id: complaintBody.targetTeacherId, 
        role: 'teacher',
        schoolId: user.schoolId 
      });
      if (!teacher) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Teacher not found in your school');
      }
      break;
      
    case complaintTypes.SUBJECT:
      const subject = await Subject.findOne({ 
        _id: complaintBody.targetSubjectId,
        schoolId: user.schoolId 
      });
      if (!subject) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Subject not found in your school');
      }
      break;
      
    case complaintTypes.ADMIN:
      const admin = await User.findOne({ 
        _id: complaintBody.targetAdminId, 
        role: { $in: ['admin', 'superadmin'] },
        schoolId: user.schoolId 
      });
      if (!admin) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Admin not found in your school');
      }
      break;
      
    case complaintTypes.STUDENT:
      // Only teachers and admins can file complaints against students
      if (!['teacher', 'admin', 'superadmin'].includes(user.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to file complaints against students');
      }
      const student = await User.findOne({ 
        _id: complaintBody.targetStudentId, 
        role: 'student',
        schoolId: user.schoolId 
      });
      if (!student) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Student not found in your school');
      }
      complaintBody.studentId = complaintBody.targetStudentId;
      break;
      
    case complaintTypes.BRANCH:
      const branch = await Branch.findOne({ 
        _id: complaintBody.targetBranchId,
        schoolId: user.schoolId 
      });
      if (!branch) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Branch not found in your school');
      }
      break;
      
    case complaintTypes.GRADE:
      const grade = await Grade.findOne({ 
        _id: complaintBody.targetGradeId,
        schoolId: user.schoolId 
      });
      if (!grade) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Grade not found in your school');
      }
      break;
  }
};

/**
 * Get complaints with role-based filtering
 * @param {Object} filter
 * @param {Object} options
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const getComplaints = async (filter, options, user) => {
  try {
    // Build base filter with school scope
    const baseFilter = { schoolId: user.schoolId };
    
    // Apply role-based filtering
    const roleFilter = buildRoleBasedFilter(user);
    Object.assign(baseFilter, roleFilter);
    
    // Apply user filters
    if (filter.complaintType) baseFilter.complaintType = filter.complaintType;
    if (filter.status) baseFilter.status = filter.status;
    if (filter.priority) baseFilter.priority = filter.priority;
    if (filter.assignedTo) baseFilter.assignedTo = filter.assignedTo;
    if (filter.targetTeacherId) baseFilter.targetTeacherId = filter.targetTeacherId;
    if (filter.targetStudentId) baseFilter.targetStudentId = filter.targetStudentId;
    if (filter.complainantId) baseFilter.complainantId = filter.complainantId;
    if (filter.generalCategory) baseFilter.generalCategory = filter.generalCategory;
    if (filter.isUrgent !== undefined) baseFilter.isUrgent = filter.isUrgent;
    if (filter.branchId) baseFilter.branchId = filter.branchId;
    if (filter.gradeId) baseFilter.gradeId = filter.gradeId;
    
    // Date range filter
    if (filter.dateFrom || filter.dateTo) {
      baseFilter.createdAt = {};
      if (filter.dateFrom) baseFilter.createdAt.$gte = new Date(filter.dateFrom);
      if (filter.dateTo) baseFilter.createdAt.$lte = new Date(filter.dateTo);
    }
    
    // Search filter
    if (filter.search) {
      baseFilter.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } }
      ];
    }
    
    // Set default options
    const defaultOptions = {
      populate: 'complainantId,targetTeacherId,targetStudentId,targetAdminId,targetSubjectId,targetBranchId,targetGradeId,assignedTo,resolvedBy,responses.respondedBy',
      sortBy: options && options.sortBy ? options.sortBy : 'createdAt:desc',
      limit: options && options.limit ? options.limit : 10,
      page: options && options.page ? options.page : 1
    };
    // Never use options.populate as a string or call split
    const complaints = await Complaint.paginate(baseFilter, defaultOptions);
    
    return responseMethod(200, true, 'Complaints retrieved successfully', complaints);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Build role-based filter for complaints visibility
 */
const buildRoleBasedFilter = (user) => {
  const filter = {};
  
  switch (user.role) {
    case 'superadmin':
    case 'admin':
      // Admins see all complaints in their school
      break;
      
    case 'teacher':
      // Teachers see:
      // 1. Complaints filed by themr
      // 2. Complaints against them (only if visibleToTeacher)
      // 3. Complaints against their students (only if visibleToStudent)
      filter.$or = [
        { complainantId: user._id },
        { $and: [{ targetTeacherId: user._id }, { visibleToTeacher: true }] },
        { $and: [{ targetStudentId: { $in: user.studentIds || [] } }, { complaintType: complaintTypes.STUDENT }, { visibleToStudent: true }] }
      ];
      // Exclude general complaints
      filter.complaintType = { $ne: complaintTypes.GENERAL };
      break;
      
    case 'student':
      // Students see:
      // 1. Complaints filed by them
      // 2. Complaints filed against them (only if visibleToStudent)
      filter.$or = [
        { complainantId: user._id },
        { $and: [{ targetStudentId: user._id }, { visibleToStudent: true }] }
      ];
      break;
      
    case 'parent':
      // Parents see:
      // 1. Complaints filed by them
      // 2. Complaints against their children (only if visibleToStudent)
      filter.$or = [
        { complainantId: user._id },
        { $and: [{ targetStudentId: { $in: user.childrenIds || [] } }, { visibleToStudent: true }] }
      ];
      break;
      
    default:
      // Other roles see only their own complaints
      filter.complainantId = user._id;
  }
  
  return filter;
};

/**
 * Get a single complaint by ID
 * @param {string} complaintId
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const getComplaintById = async (complaintId, user) => {
  try {
    const complaint = await Complaint.findOne({ 
      _id: complaintId, 
      schoolId: user.schoolId 
    })
    .populate('complainantId', 'fullname email role')
    .populate('targetTeacherId', 'fullname email')
    .populate('targetStudentId', 'fullname email')
    .populate('targetAdminId', 'fullname email')
    .populate('targetSubjectId', 'name')
    .populate('targetBranchId', 'name')
    .populate('targetGradeId', 'name')
    .populate('assignedTo', 'fullname email role')
    .populate('resolvedBy', 'fullname email role')
    .populate('responses.respondedBy', 'fullname email role');
    
    if (!complaint) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Complaint not found');
    }
    
    // Check access permissions
    if (!hasComplaintAccess(complaint, user)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }
    
    return responseMethod(200, true, 'Complaint retrieved successfully', complaint);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Check if user has access to view a complaint
 */
const hasComplaintAccess = (complaint, user) => {
  // Admins have access to all complaints
  if (['admin', 'superadmin'].includes(user.role)) {
    return true;
  }
  
  // Check if user is the complainant
  if (complaint.complainantId._id.toString() === user._id.toString()) {
    return true;
  }
  
  // Check if user is the target and that the complaint is visible to them
  if (complaint.targetTeacherId && complaint.targetTeacherId._id.toString() === user._id.toString()) {
    if (complaint.visibleToTeacher) return true;
  }
  if (complaint.targetStudentId && complaint.targetStudentId._id.toString() === user._id.toString()) {
    if (complaint.visibleToStudent) return true;
  }
  if (complaint.targetAdminId && complaint.targetAdminId._id.toString() === user._id.toString()) {
    return true;
  }
  
  // Check if user is assigned to the complaint
  if (complaint.assignedTo && complaint.assignedTo._id.toString() === user._id.toString()) {
    return true;
  }
  
  // Teachers can see complaints about their students
  if (user.role === 'teacher' && complaint.targetStudentId) {
    // This would require checking if the teacher teaches this student
    // For now, we'll assume it's handled by the calling function
    return false;
  }
  
  // General complaints are only visible to admins
  if (complaint.complaintType === complaintTypes.GENERAL) {
    return false;
  }
  
  return false;
};

/**
 * Update a complaint
 * @param {string} complaintId
 * @param {Object} updateBody
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const updateComplaint = async (complaintId, updateBody, user) => {
  try {
    const complaint = await getComplaintById(complaintId, user);
    
    // Check update permissions
    if (!canUpdateComplaint(complaint.data, user, updateBody)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to update this complaint');
    }
    
    // Restrict what can be updated based on role and complaint status
    const allowedUpdates = getAllowedUpdates(complaint.data, user);
    const filteredUpdates = Object.keys(updateBody)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateBody[key];
        return obj;
      }, {});
    // If admin is updating visibility flags, record who approved and when
    if (['admin', 'superadmin'].includes(user.role)) {
      if (Object.prototype.hasOwnProperty.call(filteredUpdates, 'visibleToTeacher')) {
        if (filteredUpdates.visibleToTeacher) {
          filteredUpdates.visibilityApprovedBy = user._id;
          filteredUpdates.visibilityApprovedAt = new Date();
        } else {
          filteredUpdates.visibilityApprovedBy = null;
          filteredUpdates.visibilityApprovedAt = null;
        }
      }
      if (Object.prototype.hasOwnProperty.call(filteredUpdates, 'visibleToStudent')) {
        if (filteredUpdates.visibleToStudent) {
          filteredUpdates.visibilityApprovedBy = user._id;
          filteredUpdates.visibilityApprovedAt = new Date();
        } else {
          filteredUpdates.visibilityApprovedBy = null;
          filteredUpdates.visibilityApprovedAt = null;
        }
      }
    }
    
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      filteredUpdates,
      { new: true, runValidators: true }
    )
    .populate('complainantId', 'fullname email role')
    .populate('targetTeacherId', 'fullname email')
    .populate('targetStudentId', 'fullname email')
    .populate('assignedTo', 'fullname email role');
    
    return responseMethod(200, true, 'Complaint updated successfully', updatedComplaint);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Check if user can update complaint
 */
const canUpdateComplaint = (complaint, user, updateBody) => {
  // Admins can update any complaint
  if (['admin', 'superadmin'].includes(user.role)) {
    return true;
  }
  
  // Users can only update their own complaints and only if not responded yet
  if (complaint.complainantId._id.toString() === user._id.toString()) {
    // Can't update if there are responses (complaint has been acted upon)
    if (complaint.responses && complaint.responses.length > 0) {
      return false;
    }
    return true;
  }
  
  return false;
};

/**
 * Get allowed update fields based on role and complaint status
 */
const getAllowedUpdates = (complaint, user) => {
  if (['admin', 'superadmin'].includes(user.role)) {
    return [
      'title', 'description', 'priority', 'assignedTo', 'status', 
      'dueDate', 'tags', 'isUrgent', 'escalationLevel', 'resolutionNotes',
      'visibleToTeacher', 'visibleToStudent'
    ];
  }
  
  // Regular users can only update basic fields of their own complaints
  return ['title', 'description', 'priority', 'tags', 'isUrgent'];
};

/**
 * Send notifications for new complaints
 */
const sendComplaintNotifications = async (complaint) => {
  // This is a placeholder for notification logic
  // In a real implementation, you would:
  // 1. Send email/SMS to relevant parties based on complaint type
  // 2. Send push notifications
  // 3. Create in-app notifications
  
  console.log(`Sending notifications for complaint: ${complaint.title}`);
  
  // Example notification logic:
  const notificationTargets = [];

  // Always notify admins (this is a placeholder - implement admin lookup as needed)
  // TODO: retrieve admin IDs for the school and add them to notificationTargets

  // Notify targets only if the complaint has been made visible to them
  switch (complaint.complaintType) {
    case complaintTypes.TEACHER:
      if (complaint.visibleToTeacher) notificationTargets.push(complaint.targetTeacherId);
      break;
    case complaintTypes.STUDENT:
      if (complaint.visibleToStudent) notificationTargets.push(complaint.targetStudentId);
      break;
    case complaintTypes.GENERAL:
      // General complaints notify admins only
      break;
  }
};

/**
 * Delete a complaint (admin only)
 * @param {string} complaintId
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const deleteComplaint = async (complaintId, user) => {
  try {
    if (!['admin', 'superadmin'].includes(user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only admins can delete complaints');
    }
    
    const complaint = await Complaint.findOne({ 
      _id: complaintId, 
      schoolId: user.schoolId 
    });
    
    if (!complaint) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Complaint not found');
    }
    
    await Complaint.findByIdAndDelete(complaintId);
    
    return responseMethod(200, true, 'Complaint deleted successfully');
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Assign a complaint to a user
 * @param {string} complaintId
 * @param {string} assignedToId
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const assignComplaint = async (complaintId, assignedToId, user) => {
  try {
    if (!['admin', 'superadmin'].includes(user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only admins can assign complaints');
    }
    
    const complaint = await Complaint.findOne({ 
      _id: complaintId, 
      schoolId: user.schoolId 
    });
    
    if (!complaint) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Complaint not found');
    }
    
    // Verify the assignee exists and is in the same school
    const User = require('../user/user.model');
    const assignee = await User.findOne({ 
      _id: assignedToId, 
      schoolId: user.schoolId,
      role: { $in: ['teacher', 'admin', 'superadmin'] }
    });
    
    if (!assignee) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Assignee not found or not authorized');
    }
    
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { 
        assignedTo: assignedToId,
        assignedDate: new Date(),
        status: complaint.status === complaintStatuses.PENDING ? complaintStatuses.IN_PROGRESS : complaint.status
      },
      { new: true }
    )
    .populate('assignedTo', 'fullname email role');
    
    return responseMethod(200, true, 'Complaint assigned successfully', updatedComplaint);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Escalate a complaint
 * @param {string} complaintId
 * @param {Object} escalationBody
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const escalateComplaint = async (complaintId, escalationBody, user) => {
  try {
    const complaint = await Complaint.findOne({ 
      _id: complaintId, 
      schoolId: user.schoolId 
    });
    
    if (!complaint) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Complaint not found');
    }
    
    // Check if user can escalate
    if (!['admin', 'superadmin'].includes(user.role) && 
        complaint.complainantId.toString() !== user._id.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to escalate this complaint');
    }
    
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { 
        escalationLevel: complaint.escalationLevel + 1,
        escalatedAt: new Date(),
        escalatedBy: user._id,
        priority: complaintPriorities.HIGH,
        isUrgent: true
      },
      { new: true }
    )
    .populate('escalatedBy', 'fullname email role');
    
    // Add escalation as a response
    const escalationResponse = {
      respondedBy: user._id,
      response: `Complaint escalated. Reason: ${escalationBody.escalationReason}`,
      responseDate: new Date()
    };
    
    updatedComplaint.responses.push(escalationResponse);
    await updatedComplaint.save();
    
    return responseMethod(200, true, 'Complaint escalated successfully', updatedComplaint);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Resolve a complaint
 * @param {string} complaintId
 * @param {Object} resolutionBody
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const resolveComplaint = async (complaintId, resolutionBody, user) => {
  try {
    const complaint = await Complaint.findOne({ 
      _id: complaintId, 
      schoolId: user.schoolId 
    });
    
    if (!complaint) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Complaint not found');
    }
    
    // Check if user can resolve
    if (!['admin', 'superadmin'].includes(user.role) && 
        (!complaint.assignedTo || complaint.assignedTo.toString() !== user._id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to resolve this complaint');
    }
    
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { 
        status: resolutionBody.status,
        resolvedBy: user._id,
        resolvedDate: new Date(),
        resolutionNotes: resolutionBody.resolutionNotes
      },
      { new: true }
    )
    .populate('resolvedBy', 'fullname email role');
    
    return responseMethod(200, true, 'Complaint resolved successfully', updatedComplaint);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Get complaint statistics
 * @param {Object} filter
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const getComplaintStats = async (filter, user) => {
  try {
    const baseFilter = { schoolId: user.schoolId };
    
    // Apply role-based filtering
    if (!['admin', 'superadmin'].includes(user.role)) {
      const roleFilter = buildRoleBasedFilter(user);
      Object.assign(baseFilter, roleFilter);
    }
    
    // Apply additional filters
    if (filter.dateFrom || filter.dateTo) {
      baseFilter.createdAt = {};
      if (filter.dateFrom) baseFilter.createdAt.$gte = new Date(filter.dateFrom);
      if (filter.dateTo) baseFilter.createdAt.$lte = new Date(filter.dateTo);
    }
    if (filter.branchId) baseFilter.branchId = filter.branchId;
    if (filter.gradeId) baseFilter.gradeId = filter.gradeId;
    if (filter.complaintType) baseFilter.complaintType = filter.complaintType;
    
    // Get stats using aggregation
    const stats = await Complaint.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          urgent: { $sum: { $cond: ["$isUrgent", 1, 0] } },
          overdue: { 
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $lt: ["$dueDate", new Date()] },
                    { $in: ["$status", ["pending", "in_progress"]] }
                  ]
                }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);
    
    // Get stats by complaint type
    const typeStats = await Complaint.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$complaintType",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get stats by priority
    const priorityStats = await Complaint.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      overview: stats[0] || {
        total: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0, urgent: 0, overdue: 0
      },
      byType: typeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: priorityStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
    
    return responseMethod(200, true, 'Complaint statistics retrieved successfully', result);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Search users for complaint targets
 * @param {Object} query
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const searchUsers = async (query, user) => {
  try {
    const User = require('../user/user.model');
    const { role, search, limit = 10 } = query;
    
    const filter = { 
      schoolId: user.schoolId,
      status: 'active'
    };
    
    if (role) {
      filter.role = role;
    }
    
    if (search) {
      filter.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('fullname email role registrationNumber branchId gradeId')
      .populate('branchId', 'name')
      .populate('gradeId', 'name')
      .limit(parseInt(limit));
    
    return responseMethod(200, true, 'Users retrieved successfully', users);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  assignComplaint,
  escalateComplaint,
  resolveComplaint,
  getComplaintStats,
  searchUsers,
  hasComplaintAccess,
  buildRoleBasedFilter,
  sendComplaintNotifications
};

const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const complaintService = require('./complaint.service');
const responseService = require('./response.service');
const { responseMethod } = require('../../utils/generalDB.methods.js/DB.methods');

/**
 * Create a new complaint
 */
const createComplaint = catchAsync(async (req, res) => {
  const result = await complaintService.createComplaint(req.body, req.user);
  res.status(result.status).send(result);
});

/**
 * Get all complaints with filtering
 */
const getComplaints = catchAsync(async (req, res) => {
  const filter = {
    complaintType: req.query.complaintType,
    status: req.query.status,
    priority: req.query.priority,
    assignedTo: req.query.assignedTo,
    targetTeacherId: req.query.targetTeacherId,
    targetStudentId: req.query.targetStudentId,
    complainantId: req.query.complainantId,
    generalCategory: req.query.generalCategory,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    isUrgent: req.query.isUrgent,
    branchId: req.query.branchId,
    gradeId: req.query.gradeId,
    search: req.query.search
  };
  
  const options = {
    sortBy: req.query.sortBy,
    limit: parseInt(req.query.limit) || 10,
    page: parseInt(req.query.page) || 1,
    // Always pass populate as undefined or array, never string
    populate: undefined
  };
  
  const result = await complaintService.getComplaints(filter, options, req.user);
  res.status(result.status).send(result);
});

/**
 * Get a specific complaint by ID
 */
const getComplaint = catchAsync(async (req, res) => {
  const result = await complaintService.getComplaintById(req.params.complaintId, req.user);
  res.status(result.status).send(result);
});

/**
 * Update a complaint
 */
const updateComplaint = catchAsync(async (req, res) => {
  const result = await complaintService.updateComplaint(req.params.complaintId, req.body, req.user);
  res.status(result.status).send(result);
});

/**
 * Delete a complaint (admin only)
 */
const deleteComplaint = catchAsync(async (req, res) => {
  await complaintService.deleteComplaint(req.params.complaintId, req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Add a response to a complaint
 */
const addResponse = catchAsync(async (req, res) => {
  const result = await responseService.addResponse(req.params.complaintId, req.body, req.user);
  res.status(result.status).send(result);
});

/**
 * Assign a complaint to a user
 */
const assignComplaint = catchAsync(async (req, res) => {
  const result = await complaintService.assignComplaint(req.params.complaintId, req.body.assignedTo, req.user);
  res.status(result.status).send(result);
});

/**
 * Escalate a complaint
 */
const escalateComplaint = catchAsync(async (req, res) => {
  const result = await complaintService.escalateComplaint(req.params.complaintId, req.body, req.user);
  res.status(result.status).send(result);
});

/**
 * Resolve a complaint
 */
const resolveComplaint = catchAsync(async (req, res) => {
  const result = await complaintService.resolveComplaint(req.params.complaintId, req.body, req.user);
  res.status(result.status).send(result);
});

/**
 * Get complaint statistics
 */
const getComplaintStats = catchAsync(async (req, res) => {
  const filter = {
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    branchId: req.query.branchId,
    gradeId: req.query.gradeId,
    complaintType: req.query.complaintType
  };
  
  const result = await complaintService.getComplaintStats(filter, req.user);
  res.status(result.status).send(result);
});

/**
 * Get my complaints (current user's complaints)
 */
const getMyComplaints = catchAsync(async (req, res) => {
  const filter = {
    complainantId: req.user._id,
    status: req.query.status,
    complaintType: req.query.complaintType,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo
  };
  
  const options = {
    sortBy: req.query.sortBy || 'createdAt:desc',
    limit: parseInt(req.query.limit) || 10,
    page: parseInt(req.query.page) || 1
  };
  
  const result = await complaintService.getComplaints(filter, options, req.user);
  res.status(result.status).send(result);
});

/**
 * Get complaints against me (current user as target)
 */
const getComplaintsAgainstMe = catchAsync(async (req, res) => {
  const filter = {
    status: req.query.status,
    complaintType: req.query.complaintType,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo
  };
  
  // Add target filters based on user role
  if (req.user.role === 'teacher') {
    filter.targetTeacherId = req.user._id;
  } else if (req.user.role === 'student') {
    filter.targetStudentId = req.user._id;
  } else if (['admin', 'superadmin'].includes(req.user.role)) {
    filter.targetAdminId = req.user._id;
  }
  
  const options = {
    sortBy: req.query.sortBy || 'createdAt:desc',
    limit: parseInt(req.query.limit) || 10,
    page: parseInt(req.query.page) || 1
  };
  
  const result = await complaintService.getComplaints(filter, options, req.user);
  res.status(result.status).send(result);
});

/**
 * Get pending complaints assigned to me
 */
const getAssignedComplaints = catchAsync(async (req, res) => {
  const filter = {
    assignedTo: req.user._id,
    status: req.query.status || 'pending',
    complaintType: req.query.complaintType,
    priority: req.query.priority,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo
  };
  
  const options = {
    sortBy: req.query.sortBy || 'priority:desc,createdAt:desc',
    limit: parseInt(req.query.limit) || 10,
    page: parseInt(req.query.page) || 1
  };
  
  const result = await complaintService.getComplaints(filter, options, req.user);
  res.status(result.status).send(result);
});

/**
 * Search users for complaint targets (teachers, students, admins)
 */
const searchUsers = catchAsync(async (req, res) => {
  const result = await complaintService.searchUsers(req.query, req.user);
  res.status(result.status).send(result);
});

module.exports = {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  addResponse,
  assignComplaint,
  escalateComplaint,
  resolveComplaint,
  getComplaintStats,
  getMyComplaints,
  getComplaintsAgainstMe,
  getAssignedComplaints,
  searchUsers
};

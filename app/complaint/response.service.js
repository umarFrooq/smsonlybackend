const httpStatus = require('http-status');
const { Complaint, complaintStatuses } = require('./complaint.model');
const ApiError = require('../../utils/ApiError');
const { responseMethod } = require('../../utils/generalDB.methods.js/DB.methods');

/**
 * Add a response to a complaint
 * @param {string} complaintId
 * @param {Object} responseBody
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const addResponse = async (complaintId, responseBody, user) => {
  try {
    const complaint = await Complaint.findOne({ 
      _id: complaintId, 
      schoolId: user.schoolId 
    });
    
    if (!complaint) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Complaint not found');
    }
    
    // Check if user can respond to this complaint
    if (!canRespondToComplaint(complaint, user)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to respond to this complaint');
    }
    
    // Create response object
    const response = {
      respondedBy: user._id,
      response: responseBody.response,
      responseDate: new Date(),
      attachments: responseBody.attachments || []
    };
    
    // Add response to complaint
    complaint.responses.push(response);
    
    // Update complaint status if it's pending
    if (complaint.status === complaintStatuses.PENDING) {
      complaint.status = complaintStatuses.IN_PROGRESS;
    }
    
    await complaint.save();
    
    // Populate the updated complaint
    const updatedComplaint = await Complaint.findById(complaintId)
      .populate('complainantId', 'fullname email role')
      .populate('responses.respondedBy', 'fullname email role');
    
    // Send notification to complainant
    await sendResponseNotification(updatedComplaint, response);
    
    return responseMethod(200, true, 'Response added successfully', updatedComplaint);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Check if user can respond to a complaint
 */
const canRespondToComplaint = (complaint, user) => {
  // Admins can respond to any complaint
  if (['admin', 'superadmin'].includes(user.role)) {
    return true;
  }
  
  // Teachers can respond to complaints against them or their students
  if (user.role === 'teacher') {
    // Complaint against the teacher
    if (complaint.targetTeacherId && complaint.targetTeacherId.toString() === user._id.toString()) {
      return true;
    }
    
    // Complaint about their student (if they are assigned to handle it)
    if (complaint.assignedTo && complaint.assignedTo.toString() === user._id.toString()) {
      return true;
    }
  }
  
  // Assigned user can respond
  if (complaint.assignedTo && complaint.assignedTo.toString() === user._id.toString()) {
    return true;
  }
  
  return false;
};

/**
 * Update a response (edit or delete)
 * @param {string} complaintId
 * @param {string} responseId
 * @param {Object} updateBody
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const updateResponse = async (complaintId, responseId, updateBody, user) => {
  try {
    const complaint = await Complaint.findOne({ 
      _id: complaintId, 
      schoolId: user.schoolId 
    });
    
    if (!complaint) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Complaint not found');
    }
    
    const responseIndex = complaint.responses.findIndex(
      res => res._id.toString() === responseId
    );
    
    if (responseIndex === -1) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Response not found');
    }
    
    const response = complaint.responses[responseIndex];
    
    // Check if user can update this response
    if (!canUpdateResponse(response, user)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to update this response');
    }
    
    // Update response
    if (updateBody.response) {
      complaint.responses[responseIndex].response = updateBody.response;
    }
    if (updateBody.attachments) {
      complaint.responses[responseIndex].attachments = updateBody.attachments;
    }
    
    await complaint.save();
    
    const updatedComplaint = await Complaint.findById(complaintId)
      .populate('responses.respondedBy', 'fullname email role');
    
    return responseMethod(200, true, 'Response updated successfully', updatedComplaint);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Check if user can update a response
 */
const canUpdateResponse = (response, user) => {
  // Admins can update any response
  if (['admin', 'superadmin'].includes(user.role)) {
    return true;
  }
  
  // Users can only update their own responses within 1 hour
  if (response.respondedBy.toString() === user._id.toString()) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return response.responseDate > oneHourAgo;
  }
  
  return false;
};

/**
 * Delete a response
 * @param {string} complaintId
 * @param {string} responseId
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const deleteResponse = async (complaintId, responseId, user) => {
  try {
    const complaint = await Complaint.findOne({ 
      _id: complaintId, 
      schoolId: user.schoolId 
    });
    
    if (!complaint) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Complaint not found');
    }
    
    const responseIndex = complaint.responses.findIndex(
      res => res._id.toString() === responseId
    );
    
    if (responseIndex === -1) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Response not found');
    }
    
    const response = complaint.responses[responseIndex];
    
    // Check if user can delete this response
    if (!canDeleteResponse(response, user)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to delete this response');
    }
    
    // Remove response
    complaint.responses.splice(responseIndex, 1);
    
    // If no responses left, revert status to pending
    if (complaint.responses.length === 0 && complaint.status === complaintStatuses.IN_PROGRESS) {
      complaint.status = complaintStatuses.PENDING;
    }
    
    await complaint.save();
    
    return responseMethod(200, true, 'Response deleted successfully');
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Check if user can delete a response
 */
const canDeleteResponse = (response, user) => {
  // Admins can delete any response
  if (['admin', 'superadmin'].includes(user.role)) {
    return true;
  }
  
  // Users can only delete their own responses within 1 hour
  if (response.respondedBy.toString() === user._id.toString()) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return response.responseDate > oneHourAgo;
  }
  
  return false;
};

/**
 * Get all responses for a complaint
 * @param {string} complaintId
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const getResponses = async (complaintId, user) => {
  try {
    const complaint = await Complaint.findOne({ 
      _id: complaintId, 
      schoolId: user.schoolId 
    })
    .populate('responses.respondedBy', 'fullname email role')
    .select('responses');
    
    if (!complaint) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Complaint not found');
    }
    
    return responseMethod(200, true, 'Responses retrieved successfully', complaint.responses);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Send notification when a response is added
 */
const sendResponseNotification = async (complaint, response) => {
  // This is a placeholder for notification logic
  console.log(`Sending response notification for complaint: ${complaint.title}`);
  
  // In a real implementation, you would:
  // 1. Send email to complainant
  // 2. Send push notification
  // 3. Create in-app notification
  // 4. Update notification flags in complaint
};

module.exports = {
  addResponse,
  updateResponse,
  deleteResponse,
  getResponses,
  canRespondToComplaint,
  canUpdateResponse,
  canDeleteResponse
};

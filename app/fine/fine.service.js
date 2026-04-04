const httpStatus = require('http-status');
const { Fine } = require('.'); // Assuming Fine model is exported from index.js
const User = require('../user/user.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const Fee = require('../fee/fee.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');

/**
 * Helper to validate related entities for fine creation against a given schoolId
 * @param {Object} fineBody - Contains studentId, branchId, relatedFeeId
 * @param {ObjectId} schoolId - The schoolId to validate against
 */
const validateFineEntities = async (fineBody, schoolId) => {
  const { studentId, branchId, relatedFeeId } = fineBody;

  if (!schoolId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'School context is missing for validation.');
  }

  if (studentId) {
    const student = await User.findOne({ _id: studentId, schoolId });
    if (!student || !['student', 'user'].includes(student.role)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Student with ID ${studentId} not found in this school or is not a valid student.`);
    }
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Student ID is required for a fine.');
  }

  if (branchId) {
    const branch = await Branch.findOne({ _id: branchId, schoolId });
    if (!branch) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found in this school.`);
    }
    // Check if student belongs to this branch if student model has branchId
    const student = await User.findOne({ _id: studentId, branchId, schoolId });
    if (!student) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Student does not belong to the specified branch in this school.`);
    }
  } else {
     throw new ApiError(httpStatus.BAD_REQUEST, 'Branch ID is required for a fine.');
  }

  if (relatedFeeId) {
    const fee = await Fee.findOne({ _id: relatedFeeId, schoolId, studentId }); // Ensure fee also belongs to same school and student
    if (!fee) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Related Fee with ID ${relatedFeeId} not found for this student in this school.`);
    }
  }
};

/**
 * Issue a new fine
 * @param {Object} fineData - Data for the fine
 * @param {ObjectId} schoolId - The ID of the school
 * @param {ObjectId} issuedByUserId - User ID of the issuer
 * @returns {Promise<Fine>}
 */
const issueFine = async (fineData, schoolId, issuedByUserId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to issue a fine.');
  }
  await validateFineEntities(fineData, schoolId);
  
  const finePayload = {
    ...fineData,
    schoolId, // Add schoolId
    issuedBy: issuedByUserId,
    status: 'pending',
  };

  const fine = await Fine.create(finePayload);
  return fine;
};

/**
 * Query for fines
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<QueryResult>}
 */
const queryFines = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query fines.');
  }
  const schoolScopedFilter = { ...filter, schoolId };
  
  // Assuming standard mongoose-paginate-v2 options.populate usage
  const fines = await Fine.paginate(schoolScopedFilter, options);
  return fines;
};

/**
 * Get fine by id
 * @param {ObjectId} fineId - Fine ID
 * @param {ObjectId} schoolId - School ID
 * @param {String} [populateOptionsStr] - Comma-separated string for population
 * @returns {Promise<Fine>}
 */
const getFineById = async (fineId, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  let query = Fine.findOne({ _id: fineId, schoolId });

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
     query = query.populate('studentId', 'fullname email')
                  .populate('branchId', 'name')
                  .populate('issuedBy', 'fullname')
                  .populate('waivedBy', 'fullname')
                  .populate('relatedFeeId', 'monthYear totalAmount');
  }

  const fine = await query.exec();
  if (!fine) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fine record not found or not associated with this school.');
  }
  return fine;
};

/**
 * Update fine status (to 'paid' or 'waived')
 * @param {ObjectId} fineId - Fine ID
 * @param {Object} updateBody - Contains status, and conditional fields (paymentDate, paymentTransactionId, waiveReason)
 * @param {ObjectId} schoolId - School ID
 * @param {ObjectId} updatedByUserId - User performing the update (becomes waivedBy if status is 'waived')
 * @returns {Promise<Fine>}
 */
const updateFineStatus = async (fineId, updateBody, schoolId, updatedByUserId) => {
  const fine = await getFineById(fineId, schoolId); // Ensures fine belongs to school

  if (fine.status === 'paid' || fine.status === 'waived') { // This check is fine as is
    throw new ApiError(httpStatus.BAD_REQUEST, `Fine is already ${fine.status} and cannot be updated.`);
  }

  // Prevent schoolId modification
  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a fine.');
  }
  delete updateBody.schoolId;

  // Re-validate entities if studentId or branchId are being changed (though less common for status updates)
  if (updateBody.studentId || updateBody.branchId) {
      const entitiesToValidate = {
          studentId: updateBody.studentId || fine.studentId,
          branchId: updateBody.branchId || fine.branchId,
          relatedFeeId: fine.relatedFeeId // Keep existing relatedFeeId for validation context
      };
      await validateFineEntities(entitiesToValidate, schoolId);
  }
  }

  if (updateBody.status === 'paid') {
    if (!updateBody.paymentDate) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment date is required when status is "paid".');
    }
    fine.status = 'paid';
    fine.paymentDate = updateBody.paymentDate;
    fine.paymentTransactionId = updateBody.paymentTransactionId; // Optional
    fine.waivedBy = undefined; // Clear waiver fields if previously set then changed
    fine.waiveReason = undefined;
  } else if (updateBody.status === 'waived') {
    if (!updateBody.waiveReason) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Waive reason is required when status is "waived".');
    }
    fine.status = 'waived';
    fine.waivedBy = updatedByUserId;
    fine.waiveReason = updateBody.waiveReason;
    fine.paymentDate = undefined; // Clear payment fields
    fine.paymentTransactionId = undefined;
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status update. Must be "paid" or "waived".');
  }

  await fine.save();
  
  // Post-status update logic (e.g., if linked to a Fee)
  // if (fine.relatedFeeId && (fine.status === 'paid' || fine.status === 'waived')) {
  //   // At this point, the fine's impact on the Fee's `fineApplied` field or total amount
  //   // would be handled. For now, as per requirements, this is simplified.
  //   // The Fee model currently only has a link `fineApplied` and doesn't auto-adjust total.
  //   // If Fee's `fineApplied` should be cleared, it would be:
  //   // await Fee.findByIdAndUpdate(fine.relatedFeeId, { $unset: { fineApplied: "" } });
  //   // Or re-evaluate fee status if fine was part of its `totalAmount` (not the case now).
  // }

  return fine;
};

module.exports = {
  issueFine,
  queryFines,
  getFineById,
  updateFineStatus,
};

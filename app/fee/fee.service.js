const httpStatus = require('http-status');
const Fee = require('./fee.model'); // Import Fee model directly
const User = require('../user/user.model'); // Adjust path as needed
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
// Fine model would be needed for applyFineToFee, e.g., const Fine = require('../fine/fine.model');

/**
 * Helper to validate related entities for fee creation/update against a given schoolId
 * @param {Object} feeBody - Contains studentId, gradeId, branchId
 * @param {ObjectId} schoolId - The schoolId to validate against
 */
const validateFeeEntities = async (feeBody, schoolId) => {
  const { studentId, gradeId, branchId } = feeBody;

  if (!schoolId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'School context is missing for validation.');
  }

  if (studentId) {
    const student = await User.findOne({ _id: studentId, schoolId });
    if (!student || !['student', 'user'].includes(student.role)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Student with ID ${studentId} not found in this school or is not a valid student.`);
    }
  }
  if (gradeId) {
    const grade = await Grade.findOne({ _id: gradeId, schoolId });
    if (!grade) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Grade with ID ${gradeId} not found in this school.`);
    }
  }
  if (branchId) {
    const branch = await Branch.findOne({ _id: branchId, schoolId });
    if (!branch) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found in this school.`);
    }
     // Further check if grade and student belong to this branch (and thus this school)
    if (gradeId && studentId) {
        const grade = await Grade.findOne({ _id: gradeId, branchId, schoolId });
        if (!grade) throw new ApiError(httpStatus.BAD_REQUEST, `Grade does not belong to the specified branch in this school.`);
        const student = await User.findOne({ _id: studentId, branchId, schoolId }); // Assuming student has branchId
        if (!student) throw new ApiError(httpStatus.BAD_REQUEST, `Student does not belong to the specified branch in this school.`);
    }
  }
};

/**
 * Create a fee record
 * @param {Object} feeData - Data for the fee
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<Fee>}
 */
const createFee = async (feeData, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to create a fee record.');
  }

  // Auto-fill gradeId and branchId from student if not provided
  if (!feeData.gradeId || !feeData.branchId) {
    const student = await User.findOne({ _id: feeData.studentId, schoolId }).select('gradeId branchId');
    if (!student) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Student with ID ${feeData.studentId} not found in this school.`);
    }
    if (!feeData.gradeId && student.gradeId) {
      feeData.gradeId = student.gradeId;
    }
    if (!feeData.branchId && student.branchId) {
      feeData.branchId = student.branchId;
    }
  }

  // Set default due date if not provided (end of current month)
  if (!feeData.dueDate) {
    const now = new Date();
    feeData.dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
  }

  // Monthly-only flow: ensure feeType is monthly (frontend may omit it)
  feeData.feeType = 'monthly';

  await validateFeeEntities(feeData, schoolId);

  const feePayload = { ...feeData, schoolId };
  // The pre-save hook in the model will calculate remainingAmount and set initial status.
  try {
    const fee = await Fee.create(feePayload);
    return fee;
  } catch (error) {
     if (error.code === 11000 || (error.message && error.message.includes("duplicate key error")) ) {
       throw new ApiError(httpStatus.CONFLICT, 'A fee record with similar unique fields (e.g., studentId, monthYear for this school) might already exist.');
     }
     throw error;
  }
};

/**
 * Query for fee records
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<QueryResult>}
 */
const queryFees = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query fee records.');
  }
  const schoolScopedFilter = { ...filter, schoolId };

  // Assuming standard mongoose-paginate-v2 options.populate usage
  const fees = await Fee.paginate(schoolScopedFilter, options);
  return fees;
};

/**
 * Get fee record by id
 * @param {ObjectId} feeId - Fee ID
 * @param {ObjectId} schoolId - School ID
 * @param {String} [populateOptionsStr] - Comma-separated string for population
 * @returns {Promise<Fee>}
 */
const getFeeById = async (feeId, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  let query = Fee.findOne({ _id: feeId, schoolId });

  if (populateOptionsStr) {
    populateOptionsStr.split(',').forEach(popField => {
      const [path, select] = popField.trim().split(':');
      if (select) {
        query = query.populate({ path, select });
      } else {
        query = query.populate(path);
      }
    });
  } else { // Default population if not specified
    query = query.populate('studentId', 'fullname email')
                 .populate('gradeId', 'title')
                 .populate('branchId', 'name')
                 .populate('paymentRecords.recordedBy', 'fullname');
  }

  const fee = await query.exec();
  if (!fee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fee record not found or not associated with this school.');
  }
  return fee;
};

/**
 * Update fee details by id (e.g., add discount, waive, change description)
 * @param {ObjectId} feeId - Fee ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Fee>}
 */
const updateFeeById = async (feeId, updateBody, schoolId) => {
  const fee = await getFeeById(feeId, schoolId); // Ensures fee belongs to school

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a fee record.');
  }
  delete updateBody.schoolId;

  // If studentId, gradeId, or branchId are being changed, re-validate them.
  if (updateBody.studentId || updateBody.gradeId || updateBody.branchId) {
    const entitiesToValidate = {
        studentId: updateBody.studentId || fee.studentId,
        gradeId: updateBody.gradeId || fee.gradeId,
        branchId: updateBody.branchId || fee.branchId,
    };
    await validateFeeEntities(entitiesToValidate, schoolId);
  }

  // The pre-save hook will recalculate remaining and status.
  if (updateBody.totalAmount !== undefined && fee.paidAmount > updateBody.totalAmount) {
      if(!updateBody.discountApplied || (updateBody.discountApplied && fee.paidAmount > (updateBody.totalAmount - updateBody.discountApplied.amount)))
      throw new ApiError(httpStatus.BAD_REQUEST, 'New total amount cannot be less than the already paid amount considering discounts.');
  }

  // Apply discount: ensure discount doesn't make paid amount exceed effective total.
  if (updateBody.discountApplied && updateBody.discountApplied.amount !== undefined) {
    const effectiveTotal = (updateBody.totalAmount !== undefined ? updateBody.totalAmount : fee.totalAmount) - updateBody.discountApplied.amount;
    if (fee.paidAmount > Math.max(0, effectiveTotal)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Discount cannot be applied as paid amount would exceed new effective total.');
    }
  }


  Object.assign(fee, updateBody);
  await fee.save();
  return fee;
};

/**
 * Record a payment for a fee
 * @param {ObjectId} feeId - Fee ID
 * @param {Object} paymentDetails - { amountPaid, paymentDate, paymentMethod, remarks }
 * @param {ObjectId} schoolId - School ID
 * @param {ObjectId} userId - User ID of the recorder
 * @returns {Promise<Fee>}
 */
const recordPayment = async (feeId, paymentDetails, schoolId, userId) => {
  const fee = await getFeeById(feeId, schoolId); // Ensures fee belongs to school

  // Do not allow recording payments on waived fees
  if (fee.status === 'waived') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Fee is already waived. No more payments can be recorded.`);
  }

  // Validate incoming payment amount
  const amount = Number(paymentDetails.amountPaid ?? paymentDetails.amount ?? paymentDetails.paid);
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payment amount. amountPaid must be a positive number.');
  }

  // Use remainingAmount to decide if further payments are allowed (more robust than checking status)
  // Use remainingAmount to decide if further payments are allowed (more robust than checking status)
  let feeToApply = fee;
  if (typeof fee.remainingAmount === 'number' && fee.remainingAmount <= 0) {
    // Try to locate a fee record for the same student and payment month that has remaining amount
    // Determine monthYear from paymentDetails.paymentDate or paymentDetails.monthYear or default to paymentDate now
    const paymentDate = paymentDetails.paymentDate ? new Date(paymentDetails.paymentDate) : new Date();
    const inferredMonthYear = paymentDetails.monthYear || `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;

    const alternate = await Fee.findOne({
      studentId: fee.studentId,
      monthYear: inferredMonthYear,
      schoolId: fee.schoolId,
      remainingAmount: { $gt: 0 },
      _id: { $ne: fee._id },
    });

    if (alternate) {
      feeToApply = alternate;
    } else {
      // If no fee exists for the student's payment month, create a new monthly fee record
      // so the payment can be recorded (this matches monthly submission flow).
      const createPayload = {
        studentId: fee.studentId,
        monthYear: inferredMonthYear,
        feeType: 'monthly',
      };

      // Prefer to carry over the same total amount if available; otherwise createFee will try to read from student.monthlyFee
      if (fee.totalAmount) createPayload.totalAmount = fee.totalAmount;
      if (fee.gradeId) createPayload.gradeId = fee.gradeId;
      if (fee.branchId) createPayload.branchId = fee.branchId;

      // Create the fee for this month and apply payment to it
      const createdFee = await createFee(createPayload, fee.schoolId);
      feeToApply = createdFee;
    }
  }

  // Normalize payment record field name to match schema (amountPaid)
  const paymentRecord = {
    amountPaid: amount,
    paymentDate: paymentDetails.paymentDate || new Date(),
    paymentMethod: paymentDetails.paymentMethod || 'other',
    remarks: paymentDetails.remarks || '',
    recordedBy: userId,
  };

  feeToApply.paymentRecords.push(paymentRecord);
  // Pre-save hook will recalc paidAmount/remainingAmount/status
  await feeToApply.save();
  return feeToApply;
};

/**
 * Apply a fine to a fee record (Placeholder)
 * @param {ObjectId} feeId - Fee ID
 * @param {ObjectId} fineId - ID of the fine record
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Fee>}
 */
const applyFineToFee = async (feeId, fineId, schoolId) => {
  const fee = await getFeeById(feeId, schoolId); // Ensures fee belongs to school

  // Validate that the fine also belongs to the same school
  // const FineModel = require('../fine/fine.model'); // Dynamic require or pass Fine model
  // const fine = await FineModel.findOne({_id: fineId, schoolId});
  // if (!fine) throw new ApiError(httpStatus.NOT_FOUND, 'Fine not found or does not belong to this school.');

  console.warn('applyFineToFee is a placeholder. Ensure fine validation against schoolId if implemented.');
  fee.fineApplied = fineId;
  await fee.save();
  return fee;
};

/**
 * Check for overdue fees and update their status (Placeholder for Cron Job)
 * This would typically be run by a scheduled task.
 * If this needs to be school-specific, it would require a schoolId parameter or iterate through schools.
 * For now, assuming it's a global check (might need adjustment for multi-tenancy).
 * @param {ObjectId} [schoolId] - Optional: to scope the check to a specific school
 * @returns {Promise<void>}
 */
const checkOverdueFees = async (schoolId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queryFilter = {
    dueDate: { $lt: today },
    status: { $in: ['pending', 'partially_paid'] },
  };

  if (schoolId) {
    queryFilter.schoolId = schoolId;
  }

  const overdueFees = await Fee.find(queryFilter);

  for (const fee of overdueFees) {
    fee.status = 'overdue';
    await fee.save();
  }
  console.log(`Checked and updated ${overdueFees.length} fees to 'overdue' ${schoolId ? `for school ${schoolId}` : 'globally'}.`);
};

/**
 * Update a specific payment record within a fee
 * @param {ObjectId} feeId - Fee ID
 * @param {ObjectId} paymentId - Payment record ID
 * @param {Object} paymentDetails - Updated payment details
 * @param {ObjectId} schoolId - School ID
 * @param {ObjectId} userId - User ID of the updater
 * @returns {Promise<Fee>}
 */
const updatePayment = async (feeId, paymentId, paymentDetails, schoolId, userId) => {
  const fee = await getFeeById(feeId, schoolId); // Ensures fee belongs to school

  const paymentRecord = fee.paymentRecords.id(paymentId);
  if (!paymentRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found.');
  }

  // Store the original amount to calculate the difference
  const originalAmount = paymentRecord.amountPaid;
  
  // Update payment record fields
  Object.assign(paymentRecord, paymentDetails);
  paymentRecord.recordedBy = userId; // Update who last modified this payment

  // Recalculate total paidAmount
  const amountDifference = paymentRecord.amountPaid - originalAmount;
  fee.paidAmount += amountDifference;

  // Ensure paidAmount doesn't go negative
  if (fee.paidAmount < 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment update would result in negative paid amount.');
  }

  // The pre-save hook will recalculate remainingAmount and update status
  await fee.save();
  return fee;
};

/**
 * Delete a specific payment record from a fee
 * @param {ObjectId} feeId - Fee ID
 * @param {ObjectId} paymentId - Payment record ID
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Fee>}
 */
const deletePayment = async (feeId, paymentId, schoolId) => {
  const fee = await getFeeById(feeId, schoolId); // Ensures fee belongs to school

  const paymentRecord = fee.paymentRecords.id(paymentId);
  if (!paymentRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found.');
  }

  // Subtract the payment amount from total paid
  fee.paidAmount -= paymentRecord.amountPaid;
  
  // Ensure paidAmount doesn't go negative
  fee.paidAmount = Math.max(0, fee.paidAmount);

  // Remove the payment record
  paymentRecord.deleteOne();

  // The pre-save hook will recalculate remainingAmount and update status
  await fee.save();
  return fee;
};

/**
 * Generate monthly fees for all active students in a school for a specific month
 * @param {String} monthYear - YYYY-MM format
 * @param {ObjectId} schoolId - School ID
 * @param {Boolean} dryRun - If true, return what would be created without creating
 * @returns {Promise<Object>} - Creation summary
 */
const generateMonthlyFees = async (monthYear, schoolId, dryRun = false) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }

  // Validate monthYear format
  const monthYearRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!monthYearRegex.test(monthYear)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'monthYear must be in YYYY-MM format.');
  }

  // Set due date (end of month) to use when checking student admission date
  const [yearStr, monthStr] = monthYear.split('-');
  const dueDateForMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0);

  // Get all active students with monthly billing cycle who were admitted on-or-before this month
  const students = await User.find({
    schoolId,
    role: 'student',
    status: 'active',
    billingCycle: 'monthly',
    monthlyFee: { $gt: 0 }, // Only students with monthly fee > 0
    createdAt: { $lte: dueDateForMonth }, // Only students admitted on or before the target month
  }).select('_id fullname monthlyFee gradeId branchId createdAt');

  if (students.length === 0) {
    return { created: 0, skipped: 0, errors: [], message: 'No active students with monthly billing found.' };
  }

  // Check which students already have fees for this month
  const existingFeeStudentIds = await Fee.find({
    schoolId,
    monthYear,
    feeType: 'monthly',
    studentId: { $in: students.map(s => s._id) }
  }).distinct('studentId');

  const existingIds = new Set(existingFeeStudentIds.map(id => id.toString()));
  const studentsToCreate = students.filter(s => !existingIds.has(s._id.toString()));

  if (dryRun) {
    return {
      created: studentsToCreate.length,
      skipped: students.length - studentsToCreate.length,
      errors: [],
      message: `Would create ${studentsToCreate.length} fees, skip ${students.length - studentsToCreate.length} existing`
    };
  }

  // Due date (end of month) already computed above
  const dueDate = dueDateForMonth; // Last day of month

  const results = { created: 0, skipped: existingIds.size, errors: [] };

  // Create fees in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < studentsToCreate.length; i += batchSize) {
    const batch = studentsToCreate.slice(i, i + batchSize);
    const feesToCreate = batch.map(student => ({
      studentId: student._id,
      schoolId,
      gradeId: student.gradeId,
      branchId: student.branchId,
      feeType: 'monthly',
      monthYear,
      dueDate,
      totalAmount: student.monthlyFee,
      appliedMonthlyFee: student.monthlyFee,
      paidAmount: 0,
      remainingAmount: student.monthlyFee,
      status: 'pending',
      description: `Monthly fee for ${monthYear}`
    }));

    try {
      await Fee.insertMany(feesToCreate, { ordered: false });
      results.created += batch.length;
    } catch (error) {
      // Handle duplicate key errors (race condition)
      if (error.writeErrors) {
        const duplicates = error.writeErrors.filter(e => e.code === 11000).length;
        results.created += (batch.length - duplicates);
        results.skipped += duplicates;
        error.writeErrors.forEach(e => {
          if (e.code !== 11000) results.errors.push(e.errmsg);
        });
      } else {
        results.errors.push(error.message);
      }
    }
  }

  return results;
};

// Semester flow removed: fees are monthly-only. No generateSemesterFees function.


module.exports = {
  createFee,
  queryFees,
  getFeeById,
  updateFeeById,
  recordPayment,
  updatePayment,
  deletePayment,
  applyFineToFee, // Placeholder
  checkOverdueFees, // Placeholder
  generateMonthlyFees,
  // generateSemesterFees removed
};

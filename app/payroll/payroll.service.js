const httpStatus = require('http-status');
const Payroll = require('./payroll.model');
const Salary = require('./salary.model');
const TeacherAttendance = require('./teacherAttendance.model');
const User = require('../user/user.model');
const ApiError = require('../../utils/ApiError');

const generatePayroll = async (schoolId, branchId, month, year) => {
  const teachers = await User.find({ schoolId, branchId, role: 'teacher' });

  const payrolls = [];
  // helper: count weekdays (Mon-Fri) in a month
  const countWorkingDays = (y, m) => {
    // m: 1-12
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) count += 1; // exclude Sunday(0) and Saturday(6)
    }
    return count || 26;
  };

  // get leave policy for the school once
  const LeavePolicy = require('./leavePolicy.model');
  const policy = await LeavePolicy.findOne({ school: schoolId });
  const policyLeaveTypes = (policy && Array.isArray(policy.leaveTypes)) ? policy.leaveTypes : [];

  for (const teacher of teachers) {
    const existingPayroll = await Payroll.findOne({
      teacher: teacher.id,
      month,
      year,
    });

    if (existingPayroll) {
      continue;
    }

    const salary = await Salary.findOne({ teacherId: teacher.id, schoolId, branchId });
    if (!salary) {
      continue;
    }

    const basicSalary = salary.basic || 0;
    // compute base allowances/bonuses/deductions from Salary document arrays if present
    const sumArray = (arr) => (Array.isArray(arr) ? arr.reduce((s, it) => s + (Number(it.amount) || 0), 0) : 0);
    const allowancesTotal = sumArray(salary.allowances);
    const bonusesTotal = sumArray(salary.bonuses);
    const salaryDeductionsTotal = sumArray(salary.deductions);

    // If `salary.net` is already set (non-zero), prefer it as the pre-leave net
    // This prevents double-calculating deductions that may already be applied in Salary.net
    const salaryNetProvided = Number(salary.net || 0) > 0;

    // Attendance-based leave calculation for the payroll month
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const attendances = await TeacherAttendance.find({
      teacher: teacher.id,
      date: { $gte: firstDay, $lte: lastDay },
    });

    // aggregate attendance counts per leave type (fractional for half day)
    const counts = {}; // { leaveTypeName: usedCount }
    const addCount = (key, v) => { counts[key] = (counts[key] || 0) + v; };
    for (const a of attendances) {
      const status = (a.status || '').toString();
      let fraction = 1;
      if (status === 'half_day_leave') fraction = 0.5;

      // if attendance has explicit leaveType, prefer it
      let ltName = undefined;
      if (a.leaveType) {
        ltName = typeof a.leaveType === 'string' ? a.leaveType : (a.leaveType.name || String(a.leaveType));
      } else {
        // best-effort map status -> policy leaveType by normalized name
        const normalizedStatus = status.replace(/[_\s]/g, '').toLowerCase();
        for (const pl of policyLeaveTypes) {
          const n = (pl.name || '').toString().replace(/[_\s]/g, '').toLowerCase();
          if (!n) continue;
          if (n.includes(normalizedStatus) || normalizedStatus.includes(n)) {
            ltName = pl.name;
            break;
          }
        }
      }

      if (!ltName) {
        // treat explicit 'absent' as uncategorized unpaid
        if (status === 'absent') ltName = '__ABSENT__';
        else ltName = '__UNCATEGORIZED__';
      }

      addCount(ltName, fraction);
    }

    // Now compute excess and deductions
    const workingDays = countWorkingDays(year, month);
    const perDay = workingDays > 0 ? Math.ceil((Number(basicSalary) || 0) / workingDays) : 0;

    const leaveUsage = [];
    const leaveDeductions = [];
    let leaveDeductionsTotal = 0;

    // For each policy leave type, compute used/allowed/excess
    for (const pl of policyLeaveTypes) {
      const name = pl.name;
      const used = counts[name] || 0;
      const allowed = Number(pl.leavesPerMonth) || 0;
      // paid flag: if paid=true, allowed paid leaves = allowed; if paid=false, allowed paid = 0
      const paidAllowed = pl.paid ? allowed : 0;
      const excess = Math.max(0, used - paidAllowed);
      leaveUsage.push({ leaveType: name, used, allowed, excess });
      if (excess > 0) {
        const amount = excess * perDay;
        leaveDeductions.push({ leaveType: name, amount, reason: `Excess ${name} leaves: used ${used}, allowed ${paidAllowed}` });
        leaveDeductionsTotal += amount;
      }
      // remove counted key so we can consider remaining uncategorized later
      if (counts[name]) delete counts[name];
    }

    // handle uncategorized or absent keys (treat as unpaid -> deduct full)
    for (const k of Object.keys(counts)) {
      const used = counts[k] || 0;
      if (used <= 0) continue;
      const amount = used * perDay;
      const label = k === '__ABSENT__' ? 'Absent' : 'Uncategorized leave';
      leaveUsage.push({ leaveType: label, used, allowed: 0, excess: used });
      leaveDeductions.push({ leaveType: label, amount, reason: `${label} used: ${used}` });
      leaveDeductionsTotal += amount;
    }

    let totalDeductions;
    let netSalary;
    if (salaryNetProvided) {
      // Salary.net already accounts for salary-level deductions => only subtract leave deductions here
      totalDeductions = Math.ceil(leaveDeductionsTotal);
      netSalary = Math.ceil(Number(salary.net || 0) - leaveDeductionsTotal);
    } else {
      totalDeductions = Math.ceil(Number(salaryDeductionsTotal || 0) + leaveDeductionsTotal);
      netSalary = Math.ceil(Number(basicSalary || 0) + Number(allowancesTotal || 0) + Number(bonusesTotal || 0) - totalDeductions);
    }
    // map salary arrays into payroll item arrays (map description -> reason)
    const mapSalaryItems = (arr) =>
      (Array.isArray(arr) ? arr.map((it) => ({ title: it.title, amount: it.amount || 0, reason: it.description || undefined })) : []);

    const payroll = await Payroll.create({
      teacher: teacher.id,
      school: schoolId,
      branch: branchId,
      month,
      year,
      basicSalary,
      netSalary,
      bonuses: bonusesTotal,
      bonusItems: mapSalaryItems(salary.bonuses),
      allowances: allowancesTotal,
      allowanceItems: mapSalaryItems(salary.allowances),
      deductions: totalDeductions,
      deductionItems: mapSalaryItems(salary.deductions),
      leaveUsage,
      leaveDeductions,
      status: 'Unpaid',
    });
    payrolls.push(payroll);
  }
  return payrolls;
};

const createPayroll = async (payrollBody) => {
  // normalize incoming body: prefer item arrays to compute totals
  const sumItems = (items) => (Array.isArray(items) ? items.reduce((s, it) => s + (Number(it.amount) || 0), 0) : 0);
  const normalizePayrollBody = (body) => {
    const b = Object.assign({}, body);
    b.basicSalary = Number(b.basicSalary || 0);

    b.bonusItems = Array.isArray(b.bonusItems) ? b.bonusItems : [];
    b.allowanceItems = Array.isArray(b.allowanceItems) ? b.allowanceItems : [];
    b.deductionItems = Array.isArray(b.deductionItems) ? b.deductionItems : [];
    b.leaveDeductions = Array.isArray(b.leaveDeductions) ? b.leaveDeductions : [];

    const bonusesFromItems = sumItems(b.bonusItems);
    const allowancesFromItems = sumItems(b.allowanceItems);
    const deductionsFromItems = sumItems(b.deductionItems);
    const leaveDeductionsTotal = sumItems(b.leaveDeductions);

    b.bonuses = Math.ceil(bonusesFromItems || Number(b.bonuses || 0));
    b.allowances = Math.ceil(allowancesFromItems || Number(b.allowances || 0));
    // total deductions should include deduction items + leave deductions
    b.deductions = Math.ceil((deductionsFromItems || Number(b.deductions || 0)) + leaveDeductionsTotal);

    // calculate net salary if not explicitly provided
    if (!b.netSalary && b.netSalary !== 0) {
      b.netSalary = Math.ceil(Number(b.basicSalary || 0) + Number(b.allowances || 0) + Number(b.bonuses || 0) - Number(b.deductions || 0));
    }

    return b;
  };

  const normalized = normalizePayrollBody(payrollBody);
  const payroll = await Payroll.create(normalized);
  return payroll;
};

/**
 * Query for payrolls
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPayrolls = async (filter, options) => {
  if (filter && filter.branchId) {
    filter.branch = filter.branchId;
  }
  if (filter && filter.schoolId) {
    filter.school = filter.schoolId;
  }
  if (filter && filter.teacherId) {
    filter.teacher = filter.teacherId;
  }
  delete filter.branchId;
  delete filter.schoolId;
  delete filter.teacherId;
  const payrolls = await Payroll.paginate(filter, { ...options, populate: 'teacher' });
  return payrolls;
};

/**
 * Get payroll by id
 * @param {ObjectId} id
 * @returns {Promise<Payroll>}
 */
const getPayrollById = async (id) => {
  return Payroll.findById(id);
};

/**
 * Update payroll by id
 * @param {ObjectId} payrollId
 * @param {Object} updateBody
 * @returns {Promise<Payroll>}
 */
const updatePayrollById = async (payrollId, updateBody) => {
  const payroll = await getPayrollById(payrollId);
  if (!payroll) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payroll not found');
  }
  // merge existing and update, then normalize to recompute totals if items provided
  const existing = payroll.toObject ? payroll.toObject() : Object.assign({}, payroll);
  const merged = Object.assign({}, existing, updateBody);

  const sumItems = (items) => (Array.isArray(items) ? items.reduce((s, it) => s + (Number(it.amount) || 0), 0) : 0);
  const normalizePayrollBody = (body) => {
    const b = Object.assign({}, body);
    b.basicSalary = Number(b.basicSalary || 0);

    b.bonusItems = Array.isArray(b.bonusItems) ? b.bonusItems : (Array.isArray(existing.bonusItems) ? existing.bonusItems : []);
    b.allowanceItems = Array.isArray(b.allowanceItems) ? b.allowanceItems : (Array.isArray(existing.allowanceItems) ? existing.allowanceItems : []);
    b.deductionItems = Array.isArray(b.deductionItems) ? b.deductionItems : (Array.isArray(existing.deductionItems) ? existing.deductionItems : []);
    b.leaveDeductions = Array.isArray(b.leaveDeductions) ? b.leaveDeductions : (Array.isArray(existing.leaveDeductions) ? existing.leaveDeductions : []);

    const bonusesFromItems = sumItems(b.bonusItems);
    const allowancesFromItems = sumItems(b.allowanceItems);
    const deductionsFromItems = sumItems(b.deductionItems);
    const leaveDeductionsTotal = sumItems(b.leaveDeductions);

    b.bonuses = Math.ceil(bonusesFromItems || Number(b.bonuses || 0));
    b.allowances = Math.ceil(allowancesFromItems || Number(b.allowances || 0));
    b.deductions = Math.ceil((deductionsFromItems || Number(b.deductions || 0)) + leaveDeductionsTotal);

    if (!b.netSalary && b.netSalary !== 0) {
      b.netSalary = Math.ceil(Number(b.basicSalary || 0) + Number(b.allowances || 0) + Number(b.bonuses || 0) - Number(b.deductions || 0));
    }

    return b;
  };

  const normalized = normalizePayrollBody(merged);
  Object.assign(payroll, normalized);
  await payroll.save();
  return payroll;
};

/**
 * Delete payroll by id
 * @param {ObjectId} payrollId
 * @returns {Promise<Payroll>}
 */
const deletePayrollById = async (payrollId) => {
  const payroll = await getPayrollById(payrollId);
  if (!payroll) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payroll not found');
  }
  await payroll.remove();
  return payroll;
};

module.exports = {
  generatePayroll,
  queryPayrolls,
  getPayrollById,
  updatePayrollById,
  deletePayrollById,
};

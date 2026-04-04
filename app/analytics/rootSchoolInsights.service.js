/**
 * Root-only enrichment: subscriptions (current + billing history) and per-branch user counts.
 */

const mongoose = require('mongoose');
const { User } = require('../../config/mongoose');
const School = require('../school/school.model');
const Branch = require('../branch/branch.model');
const SchoolBilling = require('../../models/SchoolBilling');
const BillingTransaction = require('../../models/BillingTransaction');
const SubscriptionPlan = require('../../models/SubscriptionPlan');

const SCHOOL_ROLES = ['admin', 'superadmin', 'teacher', 'student'];

function toObjectId(schoolId) {
  if (!schoolId) return null;
  if (schoolId instanceof mongoose.Types.ObjectId) return schoolId;
  return mongoose.Types.ObjectId(schoolId);
}

function planKeyFromTransaction(tx) {
  const d = tx.details || {};
  return (
    d.paymentIntent?.metadata?.planKey ||
    d.invoice?.metadata?.planKey ||
    d.session?.metadata?.planKey ||
    null
  );
}

function serializeBillingRecord(billing, planNameByKey) {
  if (!billing) return null;
  const b = billing;
  return {
    planKey: b.planKey,
    planName: planNameByKey[b.planKey] || b.planKey,
    status: b.status,
    billedStudentCount: b.studentCount,
    nextBillingDate: b.nextBillingDate,
    stripeSubscriptionId: b.stripeSubscriptionId,
    stripeCustomerId: b.stripeCustomerId,
    updatedAt: b.updatedAt,
    createdAt: b.createdAt,
  };
}

function serializeTransactions(txs) {
  return txs.map((t) => ({
    id: t._id,
    createdAt: t.createdAt,
    amount: t.amount,
    currency: t.currency,
    status: t.status,
    planKey: planKeyFromTransaction(t),
  }));
}

async function loadPlanNameMap() {
  const plans = await SubscriptionPlan.find({}).lean();
  return Object.fromEntries(plans.map((p) => [p.key, p.name]));
}

/**
 * Per-branch role counts for one school (all branches, not filtered by analytics date range).
 */
async function buildUsersByBranchBreakdown(schoolObjId) {
  const rows = await User.aggregate([
    {
      $match: {
        schoolId: schoolObjId,
        role: { $in: SCHOOL_ROLES },
      },
    },
    {
      $group: {
        _id: { bid: '$branchId', role: '$role' },
        n: { $sum: 1 },
      },
    },
  ]);

  const byBranch = {};
  const add = (bid, role, n) => {
    if (!byBranch[bid]) {
      byBranch[bid] = {
        branchId: bid,
        branchName: bid === 'unassigned' ? 'Unassigned' : '',
        admins: 0,
        superadmins: 0,
        teachers: 0,
        students: 0,
        total: 0,
      };
    }
    const b = byBranch[bid];
    if (role === 'admin') b.admins += n;
    else if (role === 'superadmin') b.superadmins += n;
    else if (role === 'teacher') b.teachers += n;
    else if (role === 'student') b.students += n;
    b.total += n;
  };

  for (const row of rows) {
    const bid = row._id.bid ? row._id.bid.toString() : 'unassigned';
    add(bid, row._id.role, row.n);
  }

  const branchDocs = await Branch.find({ schoolId: schoolObjId }).lean();
  for (const br of branchDocs) {
    const id = br._id.toString();
    const name = br.name || br.branchCode || id;
    if (!byBranch[id]) {
      byBranch[id] = {
        branchId: id,
        branchName: name,
        admins: 0,
        superadmins: 0,
        teachers: 0,
        students: 0,
        total: 0,
      };
    } else if (!byBranch[id].branchName) {
      byBranch[id].branchName = name;
    }
  }

  for (const key of Object.keys(byBranch)) {
    if (key !== 'unassigned' && !byBranch[key].branchName) {
      byBranch[key].branchName = 'Unknown branch';
    }
  }

  return Object.values(byBranch).sort((a, b) =>
    (a.branchName || '').localeCompare(b.branchName || '')
  );
}

async function getRootSchoolsOverview() {
  const [allSchools, billings, planNameByKey, schoolRoleRows, schoolBranchRoleRows, lastTxRows] =
    await Promise.all([
      School.find({}).sort({ name: 1 }).lean(),
      SchoolBilling.find({}).lean(),
      loadPlanNameMap(),
      User.aggregate([
        {
          $match: {
            schoolId: { $exists: true, $ne: null },
            role: { $in: SCHOOL_ROLES },
          },
        },
        {
          $group: {
            _id: { sid: '$schoolId', role: '$role' },
            n: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        {
          $match: {
            schoolId: { $exists: true, $ne: null },
            role: { $in: SCHOOL_ROLES },
          },
        },
        {
          $group: {
            _id: { sid: '$schoolId', bid: '$branchId', role: '$role' },
            n: { $sum: 1 },
          },
        },
      ]),
      BillingTransaction.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$schoolId',
            lastAt: { $first: '$createdAt' },
            lastAmount: { $first: '$amount' },
            lastCurrency: { $first: '$currency' },
            lastStatus: { $first: '$status' },
          },
        },
      ]),
    ]);

  const billingBySchool = Object.fromEntries(
    billings.map((b) => [b.schoolId.toString(), b])
  );

  const countsBySchool = {};
  for (const row of schoolRoleRows) {
    const sid = row._id.sid?.toString();
    if (!sid) continue;
    if (!countsBySchool[sid]) {
      countsBySchool[sid] = { admin: 0, superadmin: 0, teacher: 0, student: 0, total: 0 };
    }
    const r = row._id.role;
    if (r === 'admin') countsBySchool[sid].admin += row.n;
    else if (r === 'superadmin') countsBySchool[sid].superadmin += row.n;
    else if (r === 'teacher') countsBySchool[sid].teacher += row.n;
    else if (r === 'student') countsBySchool[sid].student += row.n;
  }
  for (const sid of Object.keys(countsBySchool)) {
    const c = countsBySchool[sid];
    c.total = c.admin + c.superadmin + c.teacher + c.student;
  }

  const branchesBySchool = {};
  const branchIds = new Set();
  for (const row of schoolBranchRoleRows) {
    const sid = row._id.sid?.toString();
    if (!sid) continue;
    const bid = row._id.bid ? row._id.bid.toString() : 'unassigned';
    if (row._id.bid) branchIds.add(row._id.bid);
    if (!branchesBySchool[sid]) branchesBySchool[sid] = {};
    if (!branchesBySchool[sid][bid]) {
      branchesBySchool[sid][bid] = {
        branchId: bid,
        admins: 0,
        superadmins: 0,
        teachers: 0,
        students: 0,
        total: 0,
      };
    }
    const b = branchesBySchool[sid][bid];
    const role = row._id.role;
    if (role === 'admin') b.admins += row.n;
    else if (role === 'superadmin') b.superadmins += row.n;
    else if (role === 'teacher') b.teachers += row.n;
    else if (role === 'student') b.students += row.n;
    b.total += row.n;
  }

  const branchDocs = branchIds.size
    ? await Branch.find({ _id: { $in: [...branchIds] } }).lean()
    : [];
  const branchNameById = Object.fromEntries(
    branchDocs.map((b) => [b._id.toString(), b.name || b.branchCode || b._id.toString()])
  );

  const lastTxBySchool = Object.fromEntries(
    lastTxRows.map((r) => [r._id?.toString(), r])
  );

  return allSchools.map((school) => {
    const sid = school._id.toString();
    const billing = billingBySchool[sid];
    const counts = countsBySchool[sid] || {
      admin: 0,
      superadmin: 0,
      teacher: 0,
      student: 0,
      total: 0,
    };
    const brMap = branchesBySchool[sid] || {};
    const branches = Object.values(brMap).map((b) => ({
      ...b,
      branchName:
        b.branchId === 'unassigned'
          ? 'Unassigned'
          : branchNameById[b.branchId] || 'Unknown branch',
    }));
    branches.sort((a, b) => (a.branchName || '').localeCompare(b.branchName || ''));

    const tx = lastTxBySchool[sid];

    return {
      schoolId: sid,
      schoolName: school.name || 'School',
      subscription: serializeBillingRecord(billing, planNameByKey),
      lastBilling: tx
        ? {
            at: tx.lastAt,
            amount: tx.lastAmount,
            currency: tx.lastCurrency,
            status: tx.lastStatus,
          }
        : null,
      users: counts,
      branches,
    };
  });
}

async function attachRootSingleSchoolInsights(stats, schoolId) {
  const schoolObjId = toObjectId(schoolId);
  if (!schoolObjId) return;

  const [planNameByKey, billing, txs, usersByBranch] = await Promise.all([
    loadPlanNameMap(),
    SchoolBilling.findOne({ schoolId: schoolObjId }).lean(),
    BillingTransaction.find({ schoolId: schoolObjId }).sort({ createdAt: -1 }).limit(50).lean(),
    buildUsersByBranchBreakdown(schoolObjId),
  ]);

  stats.rootSubscription = {
    current: serializeBillingRecord(billing, planNameByKey),
    billingHistory: serializeTransactions(txs),
  };
  stats.usersByBranch = usersByBranch;
}

module.exports = {
  getRootSchoolsOverview,
  attachRootSingleSchoolInsights,
};

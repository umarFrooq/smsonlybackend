const catchAsync = require('../../utils/catchAsync');
const rbacService = require('./rbac.service');
const pick = require("../../utils/pick");

const findRoleById = catchAsync(async (req, res) => {
  const role = await rbacService.findRoleById(req.user);
  res.sendStatus(role);
});
const deleteRole = catchAsync(async (req, res) => {
  const role = await rbacService.deleteRole(req.params.id);
  res.sendStatus(role);
});

const getRoles = catchAsync(async (req, res) => {

  const filter = pick(req.query, ['role', 'access']);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const role = await rbacService.getRoles(filter, options);
  res.sendStatus(role);
});

const createRole = catchAsync(async (req, res) => {
  const role = await rbacService.createRole(req.body);
  res.sendStatus(role);
});
const updateRole = catchAsync(async (req, res) => {
  const role = await rbacService.updateRole(req.params.id, req.body);
  res.sendStatus(role);
});

const getAllAccesses = catchAsync(async (req, res) => {
  const role = await rbacService.getAllAccesses();
  res.sendStatus(role);
});

const accessCronJob = catchAsync(async (req, res) => {
  const role = await rbacService.accessCronJob();
  res.sendStatus(role);
});

module.exports = {
  findRoleById,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getAllAccesses,
  accessCronJob
}
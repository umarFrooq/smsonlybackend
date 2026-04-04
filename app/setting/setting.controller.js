/**
 * Vintega Solutions
 *
 * setting Controller, it encapsulates all setting related methods.
 * These methods are called via API endpoints. Some endpoints may require admin level authorization.
 * 
 * @summary setting Controller, called via API endpoints
 * @author Muhammad saqlain Haidri
 *

 */


/**
 * @function getUsers //called via API endpoint
 *
 * @param {*} req // Query and body parameters
 * @param {*} res // API Response
 * @param {*} next // not used at the moment
 * @returns API Response
 */


const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const tableService = require('./setting.service');
// const { responseMessages, projectModules } = require("../../utils/response.message");

const createTable = catchAsync(async (req, res) => {
  const result = await tableService.createTable(req.body);
  res.sendStatus(result);
});

const getTableById = catchAsync(async (req, res) => {
  const result = await tableService.getTableById(req.params.tableId);
  res.sendStatus(result);
});
const updateTableById = catchAsync(async (req, res) => {
  const result = await tableService.updateTableById(req.body,req.params.tableId);
  res.sendStatus(result);
});

const deleteTableById = catchAsync(async (req, res) => {
  const result = await tableService.deleteTableById(req.params.tableId);
  res.sendStatus(result);
});

const filterTable = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['key', 'keyValue', 'to', 'from', 'label', 'active',"unit"]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const search = pick(req.query, ['name', 'value']);
  const result = await tableService.filterTable(filter, options, search);
  res.sendStatus(result);
});
const getTaxes = catchAsync(async (req, res) => {
  const result = await tableService.getTaxes(req.user,req.query);
  res.sendStatus(result);
});
module.exports = {
  
  getTableById,
  createTable,
  updateTableById,
  deleteTableById,
  filterTable,
  getTaxes
};

// const repModel = require("./report.model");
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const db = require("../../config/mongoose");
const { responseMethod } = require("@/utils/generalDB.methods.js/DB.methods");
const { dateFilter } = require("@/config/components/general.methods");
const { deleteById } = require("../../utils/generalDB.methods.js/DB.methods");
const { roleTypes, reportActions, reportTypes } = require("../../config/enums");
const qaModel = require("../q&a/q&a.model");
const repModel = db.report;
const reviewService = require("../review/review.service");
/**
 * Create a report
 * @param {Object} repBody
 * @param {Object} user
 * @returns {Promise<result>}
 */

const createReport = async (repBody, user) => {
  try {
    if (!repBody || !Object.keys(repBody).length)
      throw new ApiError(httpStatus.BAD_REQUEST, "request Body not found.");

    let brandId = null;
    let mainRef = null;

    if (repBody.type == reportTypes.QA) {
      const qa = await qaModel.findById(repBody.typeId);
      if (!qa) throw new ApiError(httpStatus.BAD_REQUEST, "Q&A not found");
      brandId = qa.brandId;
      mainRef = qa.productId;
    }
    if (repBody.type == reportTypes.REVIEW) {
      const review = await reviewService.getReviewById(repBody.typeId);
      if (!review) throw new ApiError(httpStatus.BAD_REQUEST, "review not found");
      brandId = review.sellerDetailId.id;
      mainRef = review.typeId;
    }

    if (user.sellerDetail.id != brandId)
      throw new ApiError(httpStatus.BAD_REQUEST, "you are not authorized to report");

    const report = await repModel.findOne({ typeId: repBody.typeId });
    if (!report || report.typeId != repBody.typeId) {
      repBody["userId"] = user.sellerDetail.id;
      repBody["mainRef"] = mainRef;
      const result = await repModel.create(repBody);
      return responseMethod(200, true, "report created", result);
    }
    else {
      throw new ApiError(httpStatus.BAD_REQUEST, "You have reported");
    }

  } catch (err) {
    throw new ApiError(400, err);
  }
};

/**
 * get report by Id
 * @param {ObjectId} repId
 * @returns {Promise<result>}
 */
const repById = async (id) => {
  try {
    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "id is required");
    const result = await repModel.findById(id);
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "report not found");
    return responseMethod(200, true, "report found", result);
  } catch (err) {
    throw new ApiError(400, err);
  }
};



/**
 * Querying report with filter and options
 * @param {Object} filter --filters of report
 * @param {Object} options -- options include limit, page and sortBy
 * @returns {Promise<result>}
 */

const getAllRep = async (filter, option, user) => {
  try {
    const { to, from } = filter;
    if (
      (filter.to || filter.from) &&
      (user.role === roleTypes.ADMIN || user.role === roleTypes.SUPPLIER)
    )
      filter = dateFilter(filter);
    const result = await repModel.paginate(filter, option);
    if (!result || !result.results || !result.results.length)
      throw new ApiError(httpStatus.NOT_FOUND, "No record found");

    return responseMethod(200, true, "report found", result);
  } catch (err) {
    throw new ApiError(400, err);
  }
};



/**
 * Create a Action
 * @param {Object} repBody
 * @param {Object} user
 * @returns {Promise<result>}
 */


const createAction = async (repBody, user) => {
  try {
    const report = await repModel.findById(repBody.reportId);
    if (!report) throw new ApiError(httpStatus.BAD_REQUEST, "report not found");

    if (!repBody || !Object.keys(repBody).length)
      throw new ApiError(httpStatus.BAD_REQUEST, "reqBody not found.");

    if (user && user.role != roleTypes.ADMIN)
      throw new ApiError(httpStatus.BAD_REQUEST, "you are not allowed to perform action");

    if (repBody.action == reportActions.BLOCKED && report.type == reportTypes.QA) {
      const qaUpdated = await qaModel.findByIdAndUpdate(report.typeId, { visible: false })
      if (!qaUpdated) throw new ApiError(httpStatus.BAD_REQUEST, "question not found")
    }

    if (report.type == reportTypes.REVIEW) {
      const result = await reviewService.reviewUpdateById(report.typeId, { reported: repBody.action });
      if (!result) throw new ApiError(httpStatus.BAD_REQUEST, "review not found")
    }
    const result = await updateReport(repBody.reportId, repBody,{new:true});
    return responseMethod(200, true, "action performed", result);
  } catch (err) {

    throw new ApiError(400, err);
  }
};
const  updateReport = async (id, body) => {
  const report = await repModel.findByIdAndUpdate(id, body, { new: true });
  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, "report not found");
  }
  return report;
}

module.exports = {
  createReport,
  repById,
  getAllRep,
  createAction,
  updateReport
};

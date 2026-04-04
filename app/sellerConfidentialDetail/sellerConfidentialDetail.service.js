const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { deleteFromS3 } = require("../../config/upload-to-s3");
const db = require("../../config/mongoose");
const { updateOneByFilter, responseMethod, findOne } = require("@/utils/generalDB.methods.js/DB.methods");
const { slugGenerator } = require("@/config/components/general.methods");
const { getBucketUrl } = require("@/utils/helperFunctions");
const { aws } = require("@/config/config");
const en=require('../../config/locales/en')
// const userServices = require("../user/user.service")
//const { bannerTypes} = require("../../config/enums");
const SellerConfidentialDetail = db.SellerConfidentialDetail;
/**
 * Create a SellerDetail
 * @param {Object} sellerDetailBody
 * @returns {Promise<SellerDetail>}
 */
//updated
const createSellerConfidentialDetail = async (user, sellerConfidentialDetailBody) => {

  const newSellerConfidentialDetail = new SellerConfidentialDetail({
    cnic_no: sellerConfidentialDetailBody.cnic_no,
    bankName: sellerConfidentialDetailBody.bankName,
    bankAccountTitle: sellerConfidentialDetailBody.bankAccountTitle,
    bankAccountNumber: sellerConfidentialDetailBody.bankAccountNumber,
  })

  if (sellerConfidentialDetailBody.seller && user.role === "admin") {
    newSellerConfidentialDetail.seller = sellerConfidentialDetailBody.seller;
  } else {
    newSellerConfidentialDetail.seller = user.id;

  }
  const sellerConfidentialDetail = await SellerConfidentialDetail.create(newSellerConfidentialDetail);
  // if(sellerConfidentialDetail){
  //   await userServices.updateUserById(sellerConfidentialDetail.seller,{sellerConfidentialDetail:sellerConfidentialDetail.id});
  // }

  return sellerConfidentialDetail;
}

/**
 * Update createSellerConfidentialDetail by id
 * @param {ObjectId} createSellerConfidentialDetailId
 * @param {Object} updateBody
 * @returns {Promise<SellerConfidentialDetail>}
 */
const updateSellerConfidentialDetail = async (sellerConfidentialDetailId, user, updateBody) => {
  const sellerConfidentialDetail = await getSellerConfidentialDetailById(sellerConfidentialDetailId);
  if (!sellerConfidentialDetail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_CONFIDENTIAL_MODULE.SELLER_CONFIDENTIAL_DETAIL_NOT_FOUND');
  }
  if (sellerConfidentialDetail.seller.toString() !== user.id && user.role !== "admin") {
    throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN' );
  }
  if (updateBody.seller && user.role === "admin") {
    sellerConfidentialDetail.seller = updateBody.seller;
  } else {
    sellerConfidentialDetail.seller = user.id;

  }
  Object.assign(sellerConfidentialDetail, updateBody);
  await sellerConfidentialDetail.save();
  return sellerConfidentialDetail;

};


/**
 * Get updateSellerConfidentialDetail by id
 * @param {ObjectId} id
 * @returns {Promise<SellerConfidentialDetail>}
 */
const getSellerConfidentialDetailById = async (id) => {
  return SellerConfidentialDetail.findOne({ _id: id });
};
const getSellerConfidentialDetailBySeller = async (seller) => {
  return SellerConfidentialDetail.findOne({ seller });
};
/**
 * Delete SellerConfidentialDetail by id
 * @param {ObjectId} SellerConfidentialDetailId
 * @returns {Promise<SellerConfidentialDetail>}
 */
const deleteSellerConfidentialDetail = async (sellerConfidentialDetailId, user) => {
  const sellerConfidentialDetail = await getSellerConfidentialDetailById(sellerConfidentialDetailId);
  if (!sellerConfidentialDetail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_CONFIDENTIAL_MODULE.SELLER_DETAIL_NOT_FOUND' );
  }
  if (sellerConfidentialDetail.seller.toString() !== user.id && user.role !== "admin") {
    throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
  }
  if (sellerConfidentialDetail.cnicImages.length > 0) {
    await deleteFromS3(sellerConfidentialDetail.cnicImages);
  }
  await sellerConfidentialDetail.remove();
  return sellerConfidentialDetail;
};
const uploadImages = async (sellerConfidentialDetailId, user, updateBody, files) => {
  const removeImages = [];
  const bucketHost = getBucketUrl();
  const sellerConfidentialDetail = await getSellerConfidentialDetailById(sellerConfidentialDetailId);
  if (!sellerConfidentialDetail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_CONFIDENTIAL_MODULE.SELLER_DETAIL_NOT_FOUND' );
  }
  if (sellerConfidentialDetail.seller.toString() !== user.id && user.role !== "admin") {
    throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN' );
  }

  if (updateBody.removeImages && updateBody.removeImages.length > 0) {

    updateBody.removeImages.forEach(img => {


      const image = img.replace(aws.awsCdnHost, bucketHost);
      removeImages.push(image);
      if (sellerConfidentialDetail.cnicFront && sellerConfidentialDetail.cnicFront == image)
        sellerConfidentialDetail.cnicFront = null;
      if (sellerConfidentialDetail.cnicBack && sellerConfidentialDetail.cnicBack == image)
        sellerConfidentialDetail.cnicBack = null
    });

  }

  // if ("cnicImages" in files) {

  //   for (let i = 0; i < files.cnicImages.length; i++) {
  //     fileLocation = files.cnicImages[i].location;

  //    sellerConfidentialDetail.cnicImages.push(fileLocation);
  //   }

  // }
  if (files && files.cnicFront && files.cnicFront.length && files.cnicFront[0].location) {
    sellerConfidentialDetail.cnicFront && removeImages.push(sellerConfidentialDetail.cnicFront.replace(aws.awsCdnHost, bucketHost));
    sellerConfidentialDetail.set("cnicFront", files.cnicFront[0].location);
    sellerConfidentialDetail["cnicImages"].push(files.cnicFront[0].location);
  }
  if (files && files.cnicBack && files.cnicBack.length && files.cnicBack[0].location) {
    sellerConfidentialDetail.cnicBack && removeImages.push(sellerConfidentialDetail.cnicBack.replace(aws.awsCdnHost, bucketHost));
    sellerConfidentialDetail.set("cnicBack", files.cnicBack[0].location);
    sellerConfidentialDetail["cnicImages"].push(files.cnicBack[0].location);
  }
  if (removeImages && removeImages.length > 0) {
    await deleteFromS3(removeImages);
    sellerConfidentialDetail.cnicImages = sellerConfidentialDetail.cnicImages.filter((val) =>
      !removeImages.includes(val.replace(aws.awsCdnHost, bucketHost)));
  }
  await sellerConfidentialDetail.save();
  return sellerConfidentialDetail;

};
/**
 * Query for sellerConfidentialDetails
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySellerConfidentialDetails = async (filter, options) => {

  const sellerConfidentialDetails = await SellerConfidentialDetail.paginate(filter, options);
  return sellerConfidentialDetails;
};
/**
 *Generate Api keys
 * @param {ObjectId} userId
 * @returns {Promise<SellerConfidentialDetail>}
 */
const generateApiKeys = async (userId) => {
  const sellerDetail = await SellerConfidentialDetail.findOne({ seller: userId });
  if (sellerDetail) {
    if (sellerDetail && (sellerDetail.apiKey || sellerDetail.apiSecret))
      return responseMethod(400, false, null, 'SELLER_CONFIDENTIAL_MODULE.API_KEY_AND_SECRET_KEY_ALREADY_GENERATED' );
    return await updateOneByFilter(SellerConfidentialDetail, { seller: userId }, { apiKey: slugGenerator(null, 32, 'base64', false, false), secretKey: slugGenerator(null, 32, 'base64', false, false) });
  }

  else return responseMethod(400, false, null, 'SELLER_CONFIDENTIAL_MODULE.SELLER_CONFIDENTIAL_DETAIL_NOT_FOUND' );
}

const getSellerConfidential = async (filter) => {
  return await findOne(SellerConfidentialDetail, filter);
}

module.exports = {
  uploadImages,
  createSellerConfidentialDetail,
  getSellerConfidentialDetailById,
  updateSellerConfidentialDetail,
  deleteSellerConfidentialDetail,
  getSellerConfidentialDetailBySeller,
  querySellerConfidentialDetails,
  generateApiKeys,
  getSellerConfidential
};



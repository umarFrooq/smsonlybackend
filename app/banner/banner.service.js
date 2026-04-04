const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { uploadToS3, deleteFromS3 } = require("../../config/upload-to-s3");
const db = require("../../config/mongoose");
const { bannerTypes, bannerDevices } = require("../../config/enums");
const Banner = db.Banner;
const mongoose = require("mongoose");
const { find, deleteById } = require("@/utils/generalDB.methods.js/DB.methods");
const en=require('../../config/locales/en')
const{updateLangData}=require("../../config/components/general.methods")

/**
 * Create a Banner
 * @param {Object} bannerBody
 * @returns {Promise<Banner>}
 */

const createBanner = async (bannerBody, image) => {
  const { getBannerSetById } = require("../banner-set/banner-set.service");
  const bannerSet = await getBannerSetById(bannerBody.bannerSetId);
  if (bannerSet) {
    if (bannerSet.data && bannerSet.data.device == bannerDevices.WEB) {
      if (bannerBody.url) {
        if (image && image.bannerImage && image.bannerImage.length)
          bannerBody["image"] = image.bannerImage[0].location;
        if (bannerSet && bannerSet.data)
          bannerBody["status"] = bannerSet.data.active;
        delete bannerBody.type;
        delete bannerBody.linkId;
        const banner = await Banner.create(bannerBody);
        return banner;
      } else return new ApiError(400, 'BANNER_MODULE.LINK_IS_MISSING');
    } else if (bannerSet.data && bannerSet.data.device == bannerDevices.MOBILE) {
      if (bannerBody.linkId && bannerBody.type) {
        if (image && image.bannerImage && image.bannerImage.length)
          bannerBody["image"] = image.bannerImage[0].location;
        delete bannerBody.url;
        const banner = await Banner.create(bannerBody);
        return banner;
      } else throw new ApiError(400, 'BANNER_MODULE.LINK_ID_OR_TYPE_IS_MISSING');
    } else return new ApiError(400, 'BANNER_MODULE.BANNER_SET_DEVICE_IS_MISSING');
  } else return new ApiError(400, 'BANNER_MODULE.BANNER_SET_NOT_FOUND');
}

/**
 * Update banner by id
 * @param {ObjectId} bannerId
 * @param {Object} updateBody
 * @returns {Promise<Banner>}
 */
const updateBanner = async (bannerId, updateBody) => {
  const banner = await getBannerById(bannerId);
  if (!banner) {
    throw new ApiError(httpStatus.NOT_FOUND, 'BANNER_MODULE.BANNER_NOT_FOUND');
  }
  if (updateBody.lang) {
    updateBody.lang = updateLangData(updateBody.lang, banner.lang);
  }
  Object.assign(banner, updateBody);
  await banner.save();
  return banner;

};


/**
 * Get banner by id
 * @param {ObjectId} id
 * @returns {Promise<Banner>}
 */
const getBannerById = async (id) => {
  return Banner.findOne({ _id: id });
};



// const getAllBanners = async () => {
//  const banners=await Banner.find();
//   return banners;

// }


/**
 * Delete banner by id
 * @param {ObjectId} bannerId
 * @returns {Promise<Banner>}
 */
const deleteBannerById = async (bannerId) => {
  const banner = await getBannerById(bannerId);
  if (!banner) {
    throw new ApiError(httpStatus.NOT_FOUND,'BANNER_MODULE.BANNER_NOT_FOUND');
  }

  if (banner && banner.image) {
    await deleteFromS3(banner.image);
  }
  await deleteById(Banner, bannerId)
  // await banner.remove();
  return banner;
};


/**
 * Delete banner by id
 * @param {Object} updateBody included required body
 * @param {Object} files  --object of array of images
 * @returns {Promise<Banner>}
 */
const uploadImages = async (bannerId, updateBody, files) => {
  console.log(files)

  const banner = await getBannerById(bannerId);
  if (!banner) {
    throw new ApiError(httpStatus.NOT_FOUND, 'BANNER_MODULE.BANNER_NOT_FOUND');
  }
  if (updateBody.removeImages && updateBody.removeImages.length > 0) {
    await deleteFromS3(updateBody.removeImages);
    banner.images = banner.images.filter((val) => !updateBody.removeImages.includes(val));
  }
  if (files.bannerImage && files.bannerImage.length) {
    console.log(files.bannerImage[0])
    fileLocation = files.bannerImage[0].location;
    banner.image = fileLocation;
  }
  await banner.save();
  return banner;

};
/**
 * Query for categories
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryBanners = async (filter, options) => {

  const banners = await Banner.paginate(filter, options);
  return banners;
};

const getBannerAndBannerSet = async (bannerSetId) => {


  // return await Banner.find({bannerSetId}).populate('bannerSetId');
  return await Banner.aggregate([
    { $match: { bannerSetId: mongoose.Types.ObjectId(bannerSetId) } },
    { $unwind: "$bannerSetId" },
    {
      $group: {
        _id: "$bannerSetId",
        // count: { $sum: 1 },
        bannerSetId: { $first: "$bannerSetId" }
      }
    },
    {
      $lookup: {
        from: "bannersets",
        localField: "bannerSetId",
        foreignField: "_id",
        as: "banner"
      },

    },
    {
      $lookup: {
        from: "banners",
        localField: "bannerSetId",
        foreignField: "_id",
        as: "banners"
      },

    }
  ])
}

const getBannerBannerSetId = (filter, options) => {
  if (!options)
    options = {}
  return find(Banner, filter, options, false);
}

const updateBannerStatus = async (bannerSetId, active) => {
  await Banner.updateMany({ bannerSetId }, { status: active })
}

const deleteManyBanner = async (bannerSetId) => {
  await Banner.deleteMany({ bannerSetId })
}
module.exports = {
  uploadImages,
  createBanner,
  getBannerById,
  updateBanner,
  deleteBannerById,
  queryBanners,
  getBannerAndBannerSet,
  getBannerBannerSetId,
  updateBannerStatus,
  deleteManyBanner
};



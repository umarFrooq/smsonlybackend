// const  BannerSetModel  = require("../../config/");
const db = require("../../config/mongoose");
const BannerSetModel = db.BannerSetModel
const { createNew, findById, getBySlug, updateById, deleteById, find, findOne } = require("@/utils/generalDB.methods.js/DB.methods");
const { slugGenerator } = require("@/config/components/general.methods");
// const Banner = require("../banner/banner.model");
const bannerSerivce = require("../banner/banner.service");
const { findByIdAndUpdate } = require("@/models/Shipping");
const bucketUrl = require("@/utils/helperFunctions").getBucketUrl();
const config = require("./../../config/config");
const ApiError = require("@/utils/ApiError");

const en=require('../../config/locales/en')
/**
 * Create New banner
 * @param {Object} body - body 
 */
const createBannerSet = async (body) => {
    body["slug"] = slugGenerator(body.bannerName);
    // "createNew",General Db Method to create new record
    return await createNew(BannerSetModel, body);
}

const getBannerSetById = async (id) => {
    // "createNew",General Db Method to create new record
    return await findById(BannerSetModel, id);
}

const getBannserSetBySlug = async (slug) => {
    return await getBySlug(BannerSetModel, slug);
}

const updateBannerSet = async (id, body) => {
    let bannerSet =await BannerSetModel.findById(id)
    if(!bannerSet)
    return { status: 404, isSuccess: true, data: null, message:'BANNER_MODULE.BANNER_SET_NOT_FOUND' }
    if (body.lang) {
        body.lang = updateLangData(body.lang, bannerSet.lang);
      }
    return await updateById(BannerSetModel, id, body);
}

const deleteBannerSet = async (id) => {
    await bannerSerivce.deleteManyBanner(id);
    return await deleteById(BannerSetModel, id);
}

const getAllBannerSet = async (filter, options, search, user) => {
    if (search && search.name && search.value) {
        let filterSearch = {};
        filterSearch[search.name] = new RegExp(search.value, 'i');
        Object.assign(filter, filterSearch);
    }
    if (!user || user.role != "admin")
        Object.assign(filter, { active: true });
    return await find(BannerSetModel, filter, options);
}

const getAllBannerSetAdmin = async () => {
    if (search && search.name && search.value) {
        let filterSearch = {};
        filterSearch[search.name] = new RegExp(search.value, 'i');
        Object.assign(filter, filterSearch);
    }
    return await find(BannerSetModel, filter, options);
}

const getBannerAndBannerSetAdmin = async (bannerSetId) => {
    try {
        let bannerSet = await findById(BannerSetModel, bannerSetId);
        if (bannerSet.isSuccess) {

            const getBanner = await bannerSerivce.getBannerBannerSetId({ bannerSetId: bannerSetId });
            console.log(getBanner)
            if (getBanner.isSuccess) {
                const data = bannerSet.data._doc["banners"] = getBanner.data
                console.log(data);
                return { status: 200, isSuccess: true, data: bannerSet.data, message: "ok" }
            }

            else return getBanner;
        } else {
            return bannerSet;
        }
    }
    catch (err) {
        console.log(err)
        return { status: 400, isSuccess: true, data: null, message: 'SERVER_ERROR' };
    }
    // return await Banner.find({bannerSetId}).populate('bannerSetId');
}

const updateBannerStatus = async (bannerSetId, active) => {
    try {
        await updateById(BannerSetModel, bannerSetId, { active: active });
        await bannerSerivce.updateBannerStatus(bannerSetId, active);
    } catch (err) {
        // return { status: 400, isSuccess: true, data: null, message: err};
        throw new ApiError(httpStatus.BAD_REQUEST, err.message);
    }
}

const getBannerAndSet = async (bannerSetId, user) => {
    // try {
    const filter = { _id: bannerSetId }
    if (!user || !user.role == "admin")
        filter["active"] = true;
    let bannerSet = await findOne(BannerSetModel, filter);
    if (bannerSet.isSuccess) {
        const query = { bannerSetId: bannerSetId };
        if (!user || !user.role == "admin")
            query["status"] = true
        const getBanner = await bannerSerivce.getBannerBannerSetId(query);
        console.log(getBanner)
        if (getBanner.isSuccess) {
            const data = bannerSet.data._doc["banners"] = getBanner.data;
            console.log(data);
            return { status: 200, isSuccess: true, data: bannerSet.data, message: "ok" }
        }
        else return getBanner;
    } else {
        return bannerSet;
    }
    // } 
    // catch (err) {
    //     return { status: 400, isSuccess: true, data: err, message: "Server Error" };
    // }
}

const getBannerSetAndBanners = async (query) => {
    let filter = {
        active: true 
    };
    if (query && query.bannerName) { 
        filter["bannerName"] = { '$in': query.bannerName }
    }
    let aggregation = [
        {
            $lookup: {
                from: "banners",
                let: { bannerSet: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$bannerSetId", "$$bannerSet"] },
                                    { $eq: ["$status", true] },
                                ],
                            },
                        },
                    },
                ],

                as: "out",
            },
        },
        {
            $group: {
                _id: {
                    _id: "$_id",
                    bannerName: "$bannerName",
                    location: "$location",
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                    active: "$active",
                    slug: "$slug",
                    type: "$type",
                    banners: "$out"
                },
                // unreadCount: { $sum: { $cond: ["$isMatch", 1, 0] } },
            },
        },
        { $sort: { "_id.createdAt": -1 } },
    ]

    aggregation.unshift({ $match: filter });

    return await BannerSetModel.aggregate(aggregation)
      .then((_result) => {
        let result = [..._result];
        if (config.env != "development") {
          result.forEach((bannerset) => {
            bannerset._id.banners.forEach((banner) => {
              banner.image = banner.image
                ? banner.image.replace(bucketUrl, config.aws.awsCdnHost)
                : "";
            });
          });
        }
        // return { status: 200, message: "ok", isSuccess: true, data: result };
        return result;
      })
      .catch((err) => {
        console.log(err);
        // return { status: 500, message: "Server Error", isSuccess: false, data: [] };
        throw new ApiError(500, "SERVER_ERROR");
      });
}

module.exports = {
    createBannerSet,
    getBannerSetById,
    getBannserSetBySlug,
    updateBannerSet,
    deleteBannerSet,
    getAllBannerSet,
    getAllBannerSetAdmin,
    getBannerAndBannerSetAdmin,
    updateBannerStatus,
    getBannerAndSet,
    getBannerSetAndBanners

};
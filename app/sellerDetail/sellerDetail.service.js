const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { deleteFromS3 } = require("../../config/upload-to-s3");
const db = require("../../config/mongoose");

const { findOne, responseMethod, searchQuery, aggregationPagination, atlasSearchQueryParser } = require("@/utils/generalDB.methods.js/DB.methods");
const sanitize = require("./../../utils/sanitize");
const { updateById, find } = require("@/utils/generalDB.methods.js/DB.methods");
const { nameSlugGenerator, removeSpaces, slugGenerator, updateLangData } = require("@/config/components/general.methods");
const { get } = require("mongoose");
const { userTypes, roleTypes, indexes, productTypes } = require("@/config/enums");
const cryptoRandomString = require("crypto-random-string");
const sortByParser = require("@/config/components/sortby.parser");
const { sellerDetailQuery, searchQuerysellerDetail, queryParser } = require("./sellerDetail.query");
const mongoose = require('mongoose')
const { storeUtil } = require('./sellerDetail.utils')
const { streamingUrl } = require('@/config/config')
const { isObjectId } = require("@/config/components/general.methods");
const en = require('../../config/locales/en')
//const { bannerTypes} = require("../../config/enums");
const SellerDetail = db.SellerDetail;
const Order = db.Order;
const axios = require('axios');
const { getBucketUrl } = require("@/utils/helperFunctions");
const config = require("@/config/config");

/**
 * Create a SellerDetail
 * @param {Object} sellerDetailBody
 * @returns {Promise<SellerDetail>}
 */

const createSellerDetail = async (user, sellerDetailBody) => {
  const userServices = require("../user/user.service");
  try {

    if (sellerDetailBody.categories && sellerDetailBody.categories.length == 3) {
      sellerDetailBody.categories[2] = mongoose.Types.ObjectId("65e7143c796e9220eff00c7a")
    }

    if (user.role === roleTypes.ADMIN) {
      const {getUserById} = require("../user/user.service");
      user = await getUserById(sellerDetailBody.seller);
      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
      }
    }



    const newSellerDetail = new SellerDetail({
      brandName: sellerDetailBody.brandName,
      description: sellerDetailBody.description,
      market: sellerDetailBody.market,
      address: sellerDetailBody.address,
      cityCode: sellerDetailBody.cityCode,
      city: sellerDetailBody.city,
      country: sellerDetailBody.country,
      categories: sellerDetailBody.categories,
      zipCode: sellerDetailBody.zipCode,
      area: sellerDetailBody.area,
      province: sellerDetailBody.province,
      approved: user.role == roleTypes.SUPPLIER ? true : false,
      seller: user.id,
    });

    const sellerDetail = await SellerDetail.create(newSellerDetail);
    if (sellerDetail) {
      const {updateUserById} = require("../user/user.service");
      await updateUserById(sellerDetail.seller.toString(), {
        sellerDetail: sellerDetail.id,
      });
    }
    return sellerDetail;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};
const updateSellerDetailById = async (sellerDetailId, updateBody) => {
  const sellerDetail = await SellerDetail.findByIdAndUpdate(sellerDetailId, updateBody, { new: true });
  if (!sellerDetail) {
    throw new ApiError(httpStatus.NOT_FOUND, "sellerDetail not found");
  }
  return sellerDetail;
}
const featureBrand = async (sellerDetailId, body) => {
  return await updateSellerDetailById(sellerDetailId, body);

}
/**
 * Update createSellerDetail by id
 * @param {ObjectId} createSellerDetailId
 * @param {Object} updateBody
 * @returns {Promise<SellerDetail>}
 */
const updateSellerDetail = async (sellerDetailId, user, updateBody) => {
  const sellerDetail = await getSellerDetailById(sellerDetailId);
  if (!sellerDetail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_DETAIL_MODULE.SELLER_DETAIL_NOT_FOUND');
  }
  if (sellerDetail.seller.toString() !== user.id && user.role !== "admin") {
    throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
  }
  if (updateBody.seller && user.role === "admin") {
    sellerDetail.seller = updateBody.seller;
  } else {
    sellerDetail.seller = user.id;
  }
  if (updateBody.lang) {
    updateBody.lang = updateLangData(updateBody.lang, sellerDetail.lang);
  }
  if (updateBody.categories && updateBody.categories.length == 3) {
    updateBody.categories[2] = mongoose.Types.ObjectId("65e7143c796e9220eff00c7a")
  }
  Object.assign(sellerDetail, updateBody);
  await SellerDetail.findByIdAndUpdate(sellerDetailId, updateBody);
  return sellerDetail;
};

/**
 * Get updateSellerDetail by id
 * @param {ObjectId} id
 * @returns {Promise<SellerDetail>}
 */

const getSellerDetailById = async (id) => {
  return SellerDetail.findOne({ _id: id });
};


const getstoreById = async (id) => {
  let [store, videoCount] = await Promise.all([getStore(id), getVideoCount(id)])

  if (!store.length) return null
  store = store[0];
  if (videoCount) {
    store['videos'] = videoCount
  }
  return store;
};

const getstoreBySlug = async (slug) => {
  let store = await getStore(undefined, slug)
  if (!store.length) return null
  store = store[0];
  let videoCount = await getVideoCount(store._id)
  if (videoCount) {
    store['videos'] = videoCount
  }
  return store;
};

const currentSellerDetail = async (seller) => {
  return SellerDetail.findOne({ seller });
};

/**
 * Delete SellerDetail by id
 * @param {ObjectId} SellerDetailId
 * @returns {Promise<SellerDetail>}
 */

const deleteSellerDetail = async (sellerDetailId, user) => {
  const { delProdByStore } = require("../product/product.service");
  const sellerDetail = await getSellerDetailById(sellerDetailId);
  if (!sellerDetail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_DETAIL_MODULE.SELLER_DETAIL_NOT_FOUND');
  }
  if (sellerDetail.seller.toString() !== user.id && user.role !== "admin") {
    throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
  }
  if (sellerDetail.images.length > 0) {
    await deleteFromS3(sellerDetail.images);
  }
  // remove prodcts of stores
  const prod = await delProdByStore(sellerDetailId);
  await sellerDetail.remove();

  return sellerDetail;
};
const uploadImages = async (sellerDetailId, user, updateBody, files) => {
  const bucketHost = getBucketUrl();
  const sellerDetail = await getSellerDetailById(sellerDetailId);

  if (!sellerDetail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_DETAIL_MODULE.SELLER_DETAIL_NOT_FOUND');
  }
  if (sellerDetail.seller.toString() !== user.id && user.role !== "admin") {
    throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
  }
  if (updateBody.removeImages && updateBody.removeImages.length > 0) {
    const images = updateBody.removeImages.map((image) => {
      return image.replace(config.aws.awsCdnHost, bucketHost)
    })
    await deleteFromS3(images);
    sellerDetail.images = sellerDetail.images.filter(
      (val) => !images.includes(val)
    );
  }
  if (updateBody.removeLogo) {
    if (sellerDetail.logo) {
      const logo = sellerDetail.logo.replace(config.aws.awsCdnHost, bucketHost);
      if (logo) {
        const removeLogo = await deleteFromS3(logo);
        sellerDetail.set("logo", null);

      }

    }
  }
  if ('sellerDetailLogo' in files) {
    if (!updateBody)
      updateBody = {};
    sellerDetail.set("logo", files.sellerDetailLogo[0].location);
  }


  if ("images" in files) {
    for (let i = 0; i < files.images.length; i++) {
      fileLocation = files.images[i].location;

      sellerDetail.images.push(fileLocation);
    }
  }

  await sellerDetail.save();
  return sellerDetail;
};
/**
 * Query for sellerDetails
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySellerDetails = async (filter, options, search) => {
  // options = sortByParser(options, { brandName: 1 })
  Object.assign(options, { sortBy: "brandName" });
  if (search && search.name && search.value) {
    let filterSearch = {};
    if (search.name == "brandName") {
      const newValue = removeSpaces(search.value);
      filterSearch["alias"] = new RegExp(newValue, "i");
    }
    else filterSearch[search.name] = new RegExp(search.value, "i");
    Object.assign(filter, filterSearch);
    Object.assign(filter, { approved: true });
    console.log(filter);
    const sellerDetails = await SellerDetail.paginate(filter, options);
    return sellerDetails;
  } else {
    // const sellerDetails =  sellerDetail.find()
    Object.assign(filter, { approved: true });
    const sellerDetails = await SellerDetail.paginate(filter, options);
    return sellerDetails;
  }
};
const getSellerDetailByUserId = async (seller) => {
  // const sellerDetails =  sellerDetail.find()
  const sellerDetails = await SellerDetail.findOne({ seller });
  return sellerDetails;
};

const updateSellerDetailStatus = async (userId, approved) => {
  await SellerDetail.findOneAndUpdate({ user: userId }, approved);
};

const getSellerDetailAndSeller = async (id) => {
  return await SellerDetail.findById({ _id: id }).populate({
    path: "seller",
    model: "User",
    select: { phone: 1, fullname: 1 },
  });
};

const findSellerByName = async (brandName) => {
  return await findOne(SellerDetail, { brandName: brandName });
};

const rrpGenerator = async (id, user) => {
  if (user.role === "admin") {
    if (id) {
      const sellerDetail = await getSellerDetailByUserId(id);
      if (sellerDetail) {
        const brandName = nameSlugGenerator(sellerDetail.brandName);
        return await updateSellerDetail(id, user, { brandName: brandName });
      } else {
        throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_DETAIL_MODULE.SELLER_DETAIL_NOT_FOUND');
      }
    } else {
      const getSeller = await SellerDetail.find({
        brandName: { $exists: true },
      });
      if (getSeller && getSeller.length) {
        for (let i = 0; i < getSeller.length; i++) {
          let seller = getSeller[i];
          const brandName = nameSlugGenerator(seller.brandName);
          if (brandName) {
            const abc = await SellerDetail.findByIdAndUpdate(
              seller.id,
              { rrp: brandName },
              { new: true }
            );
            // console.log(abc);
          }
        }
        return getSeller;
      } else throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_DETAIL_MODULE.SELLER_DETAIL_NOT_FOUND');
    }
  } else throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
};

const getByRRP = async (rrp) => {
  return await SellerDetail.findOne({ rrp: rrp });
};
const rrpParser = async (user, storeId) => {
  if (user.role == roleTypes.ADMIN) {
    if (!storeId) {
      const sellers = await SellerDetail.find();
      for (let i = 0; i < sellers.length; i++) {
        let seller = sellers[i];
        const slug = nameSlugGenerator(seller.brandName);
        await SellerDetail.findByIdAndUpdate(seller.id, { rrp: slug });
      }
    } else {
      const seller = await getSellerDetailById(storeId);
      if (seller) {
        const brandName = nameSlugGenerator(seller.brandName);
        const result = await SellerDetail.findByIdAndUpdate(
          storeId,
          { rrp: brandName },
          { new: true }
        );
        return {
          status: 200,
          isSuccess: true,
          message: 'UPDATED',
          data: result,
        };
      } else {
        return {
          status: 400,
          isSuccess: false,
          message: 'SELLER_DETAIL_MODULE.SELLER_DETAIL_NOT_FOUND',
          data: null,
        };
      }
    }
  } else {
    return { status: 403, isSuccess: false, message: 'Forbidden', data: null };
  }
};

const generateAlias = async (user, id, fullDb = false) => {
  if (user.role === roleTypes.ADMIN) {
    if (id) {
      const store = await getSellerDetailById(id);
      if (store) {
        return await updateById(SellerDetail, store.id, { alias: removeSpaces(store.brandName) })
      } else return responseMethod(404, false, 'SELLER_DETAIL_MODULE.SELLER_DETAIL_NOT_FOUND', null);
    } else {
      let stores
      if (fullDb) stores = await SellerDetail.find({ brandName: { $exists: true }, brandName: { $ne: null } });
      else stores = await SellerDetail.find({ $and: [{ brandName: { $exists: true } }, { alias: { $exists: false } }, { brandName: { $ne: null } }] });
      if (stores) {
        const update = new Promise((resolve, reject) => {
          resolve(stores.map(async (st) => {
            await updateById(SellerDetail, st.id, { alias: removeSpaces(st.brandName) })
          }))
        })
        const result = await update;
        return responseMethod(200, true, null, 'UPDATED');
      } else return responseMethod(404, false, null, 'SELLER_DETAIL_MODULE.SELLER_DETAIL_NOT_FOUND');
    }
  } else return responseMethod(403, false, null, 'FORBIDDEN');
}
const update = async (sellerId, body) => {
  let result = await updateById(SellerDetail, sellerId, body);
  return result
};
const costCodeGenerator = async () => {
  let stores = await SellerDetail.find()  /*{
    $or: [
      { costCode: { $exists: false } },
      { costCode: false },
      { costCenterCode: { $exists: false } },
    ],
  });  */
  for (let i = 0; i < stores.length; i++) {
    let obj = {};
    store = stores[i];
    if (store["costCenterCode"]) obj["costCode"] = false;
    else {
      // store["costCenterCode"] = await cryptoRandomString({ length: 8, type: "alphanumeric" });
      obj["costCenterCode"] = await cryptoRandomString({
        length: 8,
        type: "alphanumeric",
      });
      obj["costCode"] = false;
    }
    // store.save();
    // console.log(store.costCenterCode);
    let seller = await SellerDetail.findByIdAndUpdate(store.id, obj);
    console.log(seller);
  }

  return {
    status: 200,
    isSuccess: true,
    data: {},
    message: 'SELLER_DETAIL_MODULE.COST_CODES_NOT_FOUND',
  };
};

/**
 * Query for Users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {Object} search - search params like {name:"", value:""}
 * @param {Query} project - mongo projection query
 * @param {Query} lookUp - mongo lookup query
 * @returns {Promise<QueryResult>}
 **/
const getSellerDetail = (filter, options, search, project, lookUp, additionalquery = undefined) => {

  let filterSearch;
  // search parsing for search
  if (search && search.name && search.value) {
    filterSearch = searchQuery({ indexName: indexes.sellerDetail.search.indexName, propertyName: indexes.sellerDetail.search.propertyName }, search.value);
  }
  // Query parsing for search
  return atlasSearchQueryParser(filter, options, filterSearch, project, lookUp, additionalquery);
}
/**
 * Query for Customer sellerdetail
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */

const customerSellerDetail = async (filter, options, search) => {
  // Sorting

  Object.assign(filter, { approved: true });

  if (filter && filter.seller)
    filter.seller = mongoose.Types.ObjectId(filter.seller);
  if (filter && filter.market && isObjectId(filter.market))
    filter.market = mongoose.Types.ObjectId(filter.market);

  // Projection of required fields
  const project = {
    id: "$_id",
    _id: 0,
    images: 1,
    brandName: 1,
    city: 1,
    description: 1,
    seller: 1,
    lang: 1,
    area: 1,
    zipCode: 1,
    // user: 1

  }
  let additionalquery
  if (filter.market && !isObjectId(filter.market.toString())) {
    additionalquery = [{
      '$lookup': {
        'from': 'markets',
        'let': {
          'marketId': '$market'
        },
        'pipeline': [
          {
            '$match': {
              '$and': [
                {
                  '$expr': {
                    '$eq': [
                      '$slug', filter.market
                    ]
                  }
                }, {
                  '$expr': {
                    '$eq': [
                      '$_id', '$$marketId'
                    ]
                  }
                }
              ]
            }
          }
        ],
        'as': 'marketObj'
      }
    }, {
      '$unwind': {
        'path': '$marketObj',
        'preserveNullAndEmptyArrays': false
      }
    }]

    delete filter.market
  }
  // Get final agregation pipeline
  const query = getSellerDetail(filter, options, search, project, null, additionalquery);
  // Execution of query
  if (query) {
    const result = await aggregationPagination(SellerDetail, query.query, query.options, query.facetFilter, query.lookUp);
    if (result && result.isSuccess)
      return result.data
    else throw new ApiError(result.status, result.message);
  } else throw new ApiError(500, 'SOME_THING_WENT_WRONG_TRY_LATER');
}

const storeAnalytics = async (sellerId) => {

  if (!sellerId) throw new ApiError(400, 'SELLER_DETAIL_MODULE.SELLER_ID_MISSING');
  let result = await Order.aggregate([
    {
      '$match': {
        'seller': mongoose.Types.ObjectId(sellerId)
      }
    }, {
      '$lookup': {
        'from': 'orderstatuses',
        'let': {
          'order': '$_id'
        },
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$eq': [
                  '$order', '$$order'
                ]
              }
            }
          }
        ],
        'as': 'statuses'
      }
    }, {
      '$lookup': {
        'from': 'sellerdetails',
        'let': {
          'seller': '$seller'
        },
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$eq': [
                  '$seller', '$$seller'
                ]
              }
            }
          }, {
            '$project': {
              '_id': 1
            }
          }
        ],
        'as': 'store'
      }
    }, {
      '$unwind': {
        'path': '$store',
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'reviewstats',
        'localField': 'store._id',
        'foreignField': 'typeId',
        'as': 'rating'
      }
    }, {
      '$unwind': {
        'path': '$rating',
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$addFields': {
        'newTime': {
          '$arrayElemAt': [
            '$statuses', 0
          ]
        },
        'cofirmedTime': {
          '$arrayElemAt': [
            '$statuses', 1
          ]
        }
      }
    }, {
      '$addFields': {
        'newTime': {
          '$ifNull': [
            '$newTime', {
              'createdAt': new Date('Tue, 30 Aug 2022 10:08:32 GMT')
            }
          ]
        },
        'cofirmedTime': {
          '$ifNull': [
            '$cofirmedTime', {
              'createdAt': new Date('Sun, 25 Aug 2030 10:08:19 GMT')
            }
          ]
        }
      }
    }, {
      '$addFields': {
        'timelyShipped': {
          '$cond': {
            'if': {
              '$lte': [
                {
                  '$subtract': [
                    '$cofirmedTime.createdAt', '$newTime.createdAt'
                  ]
                }, 86400000
              ]
            },
            'then': 1,
            'else': 0
          }
        }
      }
    }, {
      '$facet': {
        'monthly_orders': [
          {
            '$match': {
              'createdAt': {
                '$gte': new Date('Mon, 01 Aug 2022 06:55:57 GMT')
              }
            }
          }, {
            '$unwind': {
              'path': '$statuses'
            }
          }, {
            '$match': {
              'statuses.name': 'confirmed'
            }
          }, {
            '$group': {
              '_id': '$statuses.name',
              'count': {
                '$sum': 1
              }
            }
          }
        ],
        'timely_orders': [
          {
            '$group': {
              '_id': null,
              'timelyShipped': {
                '$sum': '$timelyShipped'
              },
              'totalcount': {
                '$sum': 1
              }
            }
          }, {
            '$project': {
              'timelyShipped': {
                '$round': [
                  {
                    '$multiply': [
                      {
                        '$divide': [
                          '$timelyShipped', '$totalcount'
                        ]
                      }, 100
                    ]
                  }, 2
                ]
              },
              '_id': 0
            }
          }
        ],
        'rating': [
          {
            '$group': {
              '_id': '$store._id',
              'average': {
                '$avg': '$rating.avg'
              }
            }
          }, {
            '$project': {
              '_id': 0
            }
          }
        ]
      }
    }, {
      '$unwind': {
        'path': '$timely_orders',
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$unwind': {
        'path': '$rating',
        'preserveNullAndEmptyArrays': true
      }
    }
  ])
  return result;
}

const getStore = async (id = undefined, slug = undefined) => {
  let match;
  if (id) {
    match = {
      '$match': {
        '_id': mongoose.Types.ObjectId(id)
      }
    }
  }
  else if (slug) {
    match = {
      '$match': {
        'slug': slug
      }
    }
  }

  let pipeline = [
    {
      '$lookup': {
        'from': 'products',
        'let': {
          'seller': '$seller'
        },
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$eq': [
                  '$user', '$$seller'
                ]
              },
              'active': true,
              'productType': productTypes.MAIN
            }
          }, {
            '$group': {
              '_id': null,
              'count': {
                '$sum': 1
              }
            }
          }
        ],
        'as': 'products'
      }
    }, {
      '$lookup': {
        'from': 'follows',
        'let': {
          'seller': '$seller'
        },
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$eq': [
                  '$followed', '$$seller'
                ]
              }
            }
          }, {
            '$group': {
              '_id': null,
              'count': {
                '$sum': 1
              }
            }
          }
        ],
        'as': 'followers'
      }
    }, {
      '$addFields': {
        'products': {
          '$cond': {
            'if': {
              '$eq': [
                '$products', []
              ]
            },
            'then': {
              'count': 0
            },
            'else': {
              '$arrayElemAt': [
                '$products', 0
              ]
            }
          }
        },
        'followers': {
          '$cond': {
            'if': {
              '$eq': [
                '$followers', []
              ]
            },
            'then': {
              'count': 0
            },
            'else': {
              '$arrayElemAt': [
                '$followers', 0
              ]
            }
          }
        }
      }
    }, {
      '$lookup': {
        'from': 'categories',
        'localField': 'categories',
        'foreignField': '_id',
        'pipeline': [
          {
            '$project': {
              '_id': 1,
              'name': 1,
              'slug': 1
            }
          }
        ],
        'as': 'categories'
      }
    }
  ]



  if (match) {
    pipeline.unshift(match)
  }
  // const store = new Promise((resolve, reject) => {
  //   resolve(SellerDetail.aggregate(pipeline))
  // })
  // return await store;
  return SellerDetail.aggregate(pipeline)
}

const getVideoCount = async (id) => {
  let options = {
    method: 'get',
    url: `${streamingUrl}count/?brandId=${id}`
  }
  // let vidCount = new Promise( (resolve, reject) => {
  //   resolve(storeUtil({}, options))
  // } )
  return storeUtil({}, options)
}

const updateSlug = async () => {
  let stores = await db.SellerDetail.find({ slug: { $exists: true } });

  for (let i = 0; i < stores.length; i++) {
    let store = stores[i];
    // console.log(store.brandName)
    let slug = slugGenerator(store.brandName, undefined, undefined, undefined, false, false)
    console.log(slug);
    await db.SellerDetail.findByIdAndUpdate(store.id, { $set: { slug: slug } })
  }

  return { isSuccess: true, status: 200, data: null, message: 'SLUG_UPDATED' }
}

const getAllStores = async (filter) => {
  return await SellerDetail.find(filter)
}
const getBrands = async (userIds) => {
  if (userIds && userIds.length) {

    return await SellerDetail.find({ seller: { $in: userIds } }, { brandName: 1, seller: 1, slug: 1 ,logo :1})
  }
}

const translateStores = async (lang = 'ar') => {
  try {
    const stores = await SellerDetail.find({ lang: { $exists: false } }).limit(50000);
    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];
      const trans = await translateText({ lang, text: { brandName: store.brandName, description: store.description } });
      const tra = {
        lang: {
        }
      }
      tra.lang[lang] = trans;
      const updateStore = await SellerDetail.findByIdAndUpdate(store.id, tra, { new: true });
      console.log(updateStore);
    }
  } catch (err) {
    throw new ApiError(400, err.message);
  }
}
const storeCategories = async () => {
  const productService = require('@/app/product/product.service');
  const result = await productService.productCategories()
  let stores = []
  if (result && result.length !== 0) {
    for (let i = 0; i < result.length; i++) {
      let doc = result[i];
      if (doc.store && doc.categories && doc.categories.length !== 0) {
        const store = await getSellerDetailById(doc.store);

        if (store) {
          if (store.categoryUpdated !== true) {
            if (doc.categories.length >= 2) {

              store.categories = doc.categories.sort((a, b) => { return b.count - a.count }).slice(0, 2).map(cat => cat.category._id)
              if (doc.categories.length > 2) {
                store.categories.push(mongoose.Types.ObjectId("65e7143c796e9220eff00c7a"))
              }
              store.categoryUpdated = true
              await store.save()
              stores.push(store)

            } else {
              store.categories = doc.categories[0].category._id
              store.categoryUpdated = true
              await store.save()
              stores.push(store)
            }
          }


        }
      }


    }
  }
  return stores;
}

const customerSellerDetails = async (filter, options, search) => {

  options = sortByParser(options, { 'brandName': 1 });

  // Object.assign(filter, { approved: true });
  if (filter && filter.seller)
    filter.seller = mongoose.Types.ObjectId(filter.seller);
  if (filter && filter.market && isObjectId(filter.market))
    filter.market = mongoose.Types.ObjectId(filter.market);

  let result = await searchQuerySellerDetail(filter, options, search);
  if (!result || !Object.keys(result).length) {
    result = {
      "page": options.page || 1,
      "totalPages": 0,
      "limit": options.limit || 10,
      "totalResult": 0,
      "results": []
    }
  }
  return result;
}

const searchQuerySellerDetail = async (filter, options, search) => {
  Object.assign(filter, { approved: true });
  options = sortByParser(options, { 'createdAt': -1 });
  let result = await searchQuerysellerDetail(filter, options, search);
  if (!result || !Object.keys(result).length) {
    result = {
      "page": options.page || 1,
      "totalPages": 0,
      "limit": options.limit || 10,
      "totalResult": 0,
      "results": []
    }
  }
  return result;
}

const findOneSellerDetail = async (filter) => {
  return await SellerDetail.findOne(filter)
}
let updateManyStores=async(filter,updateBody)=>{
  return SellerDetail.updateMany(filter,updateBody)
 }


 const findSellerDetailById = async (id) => {
   return await SellerDetail.findById(id)
 }
/**
 * Query for Admin sellerdetail
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {Object} search - search params like {name:"", value:""}
 * @returns {Promise<QueryResult>}
 */
const sellerDetailAdmin = async (filter, options, search) => {
  return await searchQuerySellerDetail(filter, options, search);
}

const updateCommission = async (id,commission) => {
  return updateStoreById(id,{commission})
}
const updateStoreById = async (id, data) => {
const result = await SellerDetail.findByIdAndUpdate(id, data, { new: true });
if (!result) {
  throw new ApiError(400, 'STORE_NOT_FOUND');
}
return result
}
module.exports = {
  uploadImages,
  createSellerDetail,
  getSellerDetailById,
  updateSellerDetail,
  deleteSellerDetail,
  currentSellerDetail,
  querySellerDetails,
  getSellerDetailByUserId,
  updateSellerDetailStatus,
  getSellerDetailAndSeller,
  findSellerByName,
  rrpGenerator,
  getByRRP,
  rrpParser,
  generateAlias,
  update,
  costCodeGenerator,
  getSellerDetail,
  customerSellerDetail,
  storeAnalytics,
  getstoreById,
  updateSlug,
  getstoreBySlug,
  getAllStores,
  getBrands,
  translateStores,
  featureBrand,
  storeCategories,
  customerSellerDetails,
  searchQuerySellerDetail,
  findOneSellerDetail,
  updateManyStores,
  findSellerDetailById,
  updateCommission,
  sellerDetailAdmin
};

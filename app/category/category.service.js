const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { uploadToS3, deleteFromS3 } = require("../../config/upload-to-s3");
//const db = require("../../config/mongoose");
const Category = require("./category.model");
const mongoose = require("mongoose");
const { categoryTypes, catLocation, platforms } = require("../../config/enums");
const { slugGenerator, updateLangData, langImageParser } = require("../../config/components/general.methods");
const { findByIdAndUpdate } = require("./category.model");
const { findOne, updateById } = require("@/utils/generalDB.methods.js/DB.methods");
const { setCache, getCache } = require("../../utils/cache/cache");
const { categoryEnums } = require("../../config/enums");
// const productService =require("../product/product.service");
const { BAD_REQUEST, NOT_FOUND } = require("@/node_modules/http-status/lib/index");


const en = require('../../config/locales/en');
const { objectId } = require("../auth/custom.validation");

const sortByParser = require("@/config/components/sortby.parser");
/**
 * Create a Category
 * @param {Object} categoryBody
 * @returns {Promise<Category>}
 */

const createCategory = async (categoryBody) => {
  let newCategory = categoryAttributes(categoryBody);

  // let newCategory;
  // if (categoryBody && categoryBody.attributeRequired) {
  //   if (!categoryBody.attributes || categoryBody.attributes.length <= 0) {
  //     throw new ApiError(400, "Category attributes are required.");
  //   }
  //   if (categoryBody.attributes && categoryBody.attributes.length) {
  //     let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index);
  //     const duplicateVal = findDuplicates(categoryBody.attributes)
  //     if (duplicateVal.length) {
  //       throw new ApiError(400, "Duplicate attributes are not allowed.");
  //     }
  //     categoryBody.attributes = categoryBody.attributes.filter(str => {
  //       return /\S/.test(str);
  //     });
  //     // console.log(arraySpace)
  //     if (!categoryBody.attributes || categoryBody.attributes <= 0)
  //       throw new ApiError(400, "Null values in attributes are not allowed.");
  //   }
  //   newCategory = new Category({
  //     name: categoryBody.name,
  //     slug: slugGenerator(categoryBody.name),
  //     commission: categoryBody.commission,
  //     attributes: categoryBody.attributes,
  //     attributeRequired: categoryBody.attributeRequired
  //   });
  // } else
  //   newCategory = new Category({
  //     name: categoryBody.name,
  //     slug: slugGenerator(categoryBody.name),
  //     commission: categoryBody.commission
  //   });
  if (categoryBody.description) {
    newCategory.description = categoryBody.description;
  }
  if (categoryBody.mainCategory) {
    const mainCategory = await getCategoryById(categoryBody.mainCategory);
    if (!mainCategory) {
      throw new ApiError(httpStatus.NOT_FOUND, 'CATEGORY_MODULE.MAIN_CATEGORY_NOT_FOUND');
    }

    newCategory.mainCategory = mainCategory.id;
    newCategory.type = categoryTypes.SUB_CATEGORY;
  }
  let result = await Category.create(newCategory);
  const treeMap = await calculateTree(result._id);
  result.tree = treeMap[result._id] || result.name;
  await result.save();

  categorySlugUpdater(result._id)
  if (result) setAllCategoryCache();
  return result;

};

/**
 * Update Category by id
 * @param {ObjectId} categoryId
 * @param {Object} updateBody
 * @returns {Promise<Category>}
  */
const updateCategoryById = async (categoryId, updateBody) => {

  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CATEGORY_MODULE.CATEGORY_NOT_FOUND');
  }
  if (updateBody.hasOwnProperty('platformIds')) {
    if (category.platform === platforms.ALIEXPRESS) {
      throw new ApiError(httpStatus.BAD_REQUEST, '[AliExpress Category] cannot be mapped against [AliExpress Category]');
    }
    if (updateBody.platformIds.length === 0) {
      for (let i = 0; i < category.ae_id.length; i++) {
        const ae_cat = await Category.findOne({ platformId: category.ae_id[i] })
        Object.assign(ae_cat, {
          mappedWith: null
        })
        await ae_cat.save()
      }
      updateBody.ae_id = []
      updateBody.platform_specs = []
    }

    if (updateBody.platformIds.length > 0) {

      const leafNodes = await Category.find({ mainCategory: mongoose.Types.ObjectId(categoryId) })

      if (leafNodes.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Category Mapping');
      }

      const aeCats = await Category.find({ platformId: { $in: updateBody.platformIds } })

      if (!aeCats || !aeCats.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'CATEGORY_NOT_FOUND');
      }

      let ae_id = []
      let platform_specs = []
      for (let i = 0; i < aeCats.length; i++) {
        let aeCat = aeCats[i]
        const leafNodes = await Category.find({ mainCategory: mongoose.Types.ObjectId(aeCat.id) })

        if (leafNodes.length > 0) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Category Mapping');
        }

        const alreadyMap = await Category.find({ ae_id: aeCat.platformId })

        if (alreadyMap.length > 0) {
          const already = alreadyMap[0]._id.toString()
          const currentCat = category._id.toString()

          if (already !== currentCat) {
            throw new ApiError(httpStatus.BAD_REQUEST, `[${aeCat.name}] is already mapped against [${alreadyMap[0].name}]`);
          }

        }
        ae_id.push(aeCat.platformId)
        platform_specs.push({
          categoryId: aeCat._id,
          platform: aeCat.platform,
          categoryName: aeCat.name
        })
        Object.assign(aeCat, { mappedWith: category.id })
        await aeCat.save()
        //  const cat = await categoriesfinder({_id:category.id}) 
        //  const prodCatUpdate = await Product.updateMany({category: aeCat.id},
        //   { $set: {
        //      category: category.id ,
        //      categories : cat.categories,
        //      categoryTree:  cat.categoriesIds  } })
        await Product.updateMany({ category: aeCat.id }, { $set: { category: category.id } })

      }

      if (ae_id.length > 0 && platform_specs.length > 0) {
        updateBody.ae_id = ae_id
        updateBody.platform_specs = platform_specs
      }
      if (category.ae_id.length > 0) {
        let result = category.ae_id.filter(value => !updateBody.platformIds.includes(value));
        if (result.length > 0) {
          for (let i = 0; i < result.length; i++) {
            const ae_cat = await Category.findOne({ platformId: result[i] })
            Object.assign(ae_cat, {
              mappedWith: null
            })
            await ae_cat.save()
          }
        }
      }

    }

    delete updateBody.platformIds
  }
  categoryAttributes(updateBody);
  if (!updateBody.attributeRequired) delete updateBody.attributes;
  if (updateBody.lang) {
    updateBody.lang = updateLangData(updateBody.lang, category.lang);
  }
  Object.assign(category, updateBody);
  let result = await Category.findByIdAndUpdate(categoryId, updateBody, { new: true });
  if (updateBody.name) {
    categorySlugUpdater(result._id);
  }
  if (result) setAllCategoryCache();
  return result

};

/**
 * Get product by id
 * @param {ObjectId} id
 * @returns {Promise<Category>}
 */
const getCategoryById = async (id) => {
  let category;
  // let cacheData = await getCache(categoryEnums.KEYS.CATEGORIES, id);
  // if (cacheData) {
  //   category = cacheData
  // } else {
  category = await Category.findById(id);
  // await setCache(categoryEnums.KEYS.CATEGORIES, id, category, categoryEnums.TTL.FIVE_MIN)
  // }
  return category;
}
// const getPopulatedCategory = async (id) => {
//   return Category.findOne({_id:id}).populate('subCategories')
// }

const getAllCategories = async (options, filter) => {
  let allCategory
  // console.log(options.sortBy)
  let cacheKey = categoryEnums.KEYS.ALL_CATEGORIES;
  if (filter.featured) cacheKey += "-featured"
  let cacheData = await getCache(cacheKey);
  if (cacheData && cacheData.length > 0) {
    allCategory = cacheData
  } else {
    allCategory = await getAllCategoriesFromDataBase(options, filter)
    setCache(
      categoryEnums.KEYS.ALL_CATEGORIES,
      undefined,
      allCategory,
      categoryEnums.TTL.FIVE_MIN
    );
  }
  return allCategory;
};

/**
 * Delete Product by id
 * @param {ObjectId} categoryId
 * @returns {Promise<Category>}
 */

const getAllCategoriesFromDataBase = async (options, filter) => {
  options = sortByParser(options, { index: 1 })
  let allCategory
  //console.log(options.sortBy)
  let query = {
    type: categoryTypes.MAIN_CATEGORY,
    platform: platforms.BAZAARGHAR//,

    // "categorySpecs.productsCount":{$gt:0},"categorySpecs.active":true
  }
  if (filter && filter.featured)
    query["featured"] = true
  allCategory = await Category.find(query)
    .select('type name mainImage mainCategory slug categorySpecs active lang platform index location featured tree featured').sort(options.sortBy);

  return allCategory;
};

const deleteCategoryById = async (categoryId) => {
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CATEGORY_MODULE.CATEGORY_NOT_FOUND');
  }

  //   if (category.categoryType===categoryTypes.MAIN) {

  // await Category.deleteMany({mainCategory:category.id}).exec();

  //   }
  if (category.mainImage) {
    await deleteFromS3(category.mainImage);
  }
  if (category.gallery.length > 0) {
    await deleteFromS3(category.gallery);
  }

  let result = await category.remove();
  // Cache delete in category
  if (result) {
    setAllCategoryCache()
    return { status: 200, isSuccess: true, data: {}, message: 'CATEGORY_MODULE.CATEGORY_DELETED' };
  };
};

const getBySlug = async (params) => {
  const category = await Category.findOne({ slug: params.slug });
  console.log("function getBySlug category.service.js ", category);

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CATEGORY_MODULE.CATEGORY_NOT_FOUND');
  }

  return category;
};

const uploadImages = async (categoryId, updateBody, files) => {
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CATEGORY_MODULE.CATEGORY_NOT_FOUND');
  }

  if (updateBody.removeImages && updateBody.removeImages.length > 0) {
    await deleteFromS3(updateBody.removeImages);
    category.gallery = category.gallery.filter(
      (val) => !updateBody.removeImages.includes(val)
    );
  }
  if ("mainImage" in files && !("gallery" in files)) {
    //const deleteFiles=   deleteFromS3(product.mainImage)
    if (category.mainImage) {
      await deleteFromS3(category.mainImage);
    }
    // const uploadedFiles = uploadToS3({
    //   file: files.mainImage,
    //   folderName: `categoriesMainImages/${category.id}`,
    // });
    // await uploadedFiles.then((response) => {
    //   category.mainImage = response[0];
    // });
    category.mainImage = files.mainImage[0].location;
  }
  if ("mainImage" in files && "gallery" in files) {
    if (category.mainImage) {
      await deleteFromS3(category.mainImage);
    }
    category.mainImage = files.mainImage[0].location;
    for (let i = 0; i < files.gallery.length; i++) {
      fileLocation = files.gallery[i].location;

      category.gallery.push(fileLocation);
    }
    // const uploadedFiles = Promise.all([
    //   uploadToS3({
    //     file: files.mainImage,
    //     folderName: `categoriesMainImages/${category.id}`,
    //   }),
    //   uploadToS3({
    //     file: files.gallery,
    //     folderName: `categoriesGallery/${category.id}`,
    //   }),
    // ]);
    // await uploadedFiles.then((response) => {
    //   category.mainImage = response[0][0];
    //   for (let i = 0; i < response[1].length; i++) {
    //     fileLocation = response[1][i];
    //     category.gallery.push(fileLocation);
    //   }
    // });
  }
  if ("gallery" in files && !("mainImage" in files)) {
    // const uploadedFiles = uploadToS3({
    //   file: files.gallery,
    //   folderName: `categoriesGallery/${category.id}`,
    // });
    // await uploadedFiles.then((response) => {
    //   for (let i = 0; i < response.length; i++) {
    //     fileLocation = response[i];
    //     category.gallery.push(fileLocation);
    //   }
    // });
    for (let i = 0; i < files.gallery.length; i++) {
      fileLocation = files.gallery[i].location;
      category.gallery.push(fileLocation);
    }
  }

  if ("bannerImage" in files && !updateBody.lang) {
    if (category.bannerImage) {
      await deleteFromS3(category.bannerImage);
    }
    category.bannerImage = files.bannerImage[0].location;
  }
  if ("bannerPhone" in files) {
    if (category.bannerPhone) {
      deleteFromS3(category.bannerPhone);
    }
    category.bannerPhone = files.bannerPhone[0].location;
  }

  if ("wideBannerImage" in files && !updateBody.lang) {
    if (category.wideBannerImage) {
      await deleteFromS3(category.wideBannerImage);
    }
    category.wideBannerImage = files.wideBannerImage[0].location;
  }
  if (("bannerImage" in files || "wideBannerImage" in files) && updateBody.lang) {
    if ("bannerImage" in files) {
      const lang = langImageParser(category.lang, updateBody, files.bannerImage[0].location, "bannerImage");
      category.lang = lang;
    }
    if ("wideBannerImage" in files) {
      const lang = langImageParser(category.lang, updateBody, files.wideBannerImage[0].location, "wideBannerImage");
      category.lang = lang;
    }
  }
  const result = Category.findByIdAndUpdate(categoryId, category, { new: true })
  // await category.save();
  // let categories = await getAllCategoriesFromDataBase({})
  // // if (categories) {
  // //   await setCache(categoryEnums.KEYS.CATEGORIES, categories, categoryEnums.TTL.DAY)
  // // }
  return result;
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
const queryCategories = async (filter, options) => {
  Object.assign(options, { sortBy: 'index:1' });
  if (filter.location && filter.location.length) {
    filter.location = {
      $in: filter.location
    }
  }
  Object.assign(filter, { type: categoryTypes.MAIN_CATEGORY });

  let categories = await Category.paginate(filter, options);

  //categories= await CategoryCache.getAllCategory(categories.result)

  return categories;
};

const findByName = async (name) => {
  return await findOne(Category, { name: name });
};

const categoryAttributes = (categoryBody) => {
  let newCategory;
  if (categoryBody && categoryBody.attributeRequired) {
    if (!categoryBody.attributes || categoryBody.attributes.length <= 0) {
      throw new ApiError(400, 'CATEGORY_MODULE.CATEGORY_ATTRIBUTES_REQUIRED');
    }
    if (categoryBody.attributes && categoryBody.attributes.length) {
      let findDuplicates = (arr) =>
        arr.filter((item, index) => arr.indexOf(item) != index);
      const duplicateVal = findDuplicates(categoryBody.attributes);
      if (duplicateVal.length) {
        throw new ApiError(400, 'CATEGORY_MODULE.DUPLICATE_ATTRIBUTES_ARE_NOT_ALLOWED');
      }
      categoryBody.attributes = categoryBody.attributes.filter((str) => {
        return /\S/.test(str);
      });
      // console.log(arraySpace)
      if (!categoryBody.attributes || categoryBody.attributes <= 0)
        throw new ApiError(400, 'CATEGORY_MODULE.NULL_VALUES_ARE_NOT_ALLOWED');
    }
    newCategory = new Category({
      name: categoryBody.name,
      commission: categoryBody.commission,
      attributes: categoryBody.attributes,
      attributeRequired: categoryBody.attributeRequired,
      location: categoryBody.location || catLocation.DEFAULT
    });
    return newCategory;
  } else {
    newCategory = new Category({
      name: categoryBody.name,
      commission: categoryBody.commission,
      location: categoryBody.location || catLocation.DEFAULT
    });
    return newCategory;
  }
};

const categoryPicker = async (category, categories) => {
  if (!category)
    return {
      status: 200,
      isSuccessfull: false,
      data: {},
      massage: 'CATEGORY_MODULE.CATEGORY_IS_NOT_PROVIDED',
    };
  if (!categories || !categories.length)
    return {
      status: 200,
      isSuccessfull: false,
      data: {},
      massage: 'CATEGORY_MODULE.CATEGORY_IS_NOT_PROVIDED',
    };
  // categories = ["Womens", "Sweat Shirts & Hoodies", "Fashion"];
  const result = await Category.aggregate([
    {
      $match: {
        name: category,
      },
    },
    {
      $graphLookup: {
        from: "categories",
        startWith: "$_id",
        connectFromField: "mainCategory",
        connectToField: "_id",
        depthField: "depth",
        as: "herarchy",
      },
    },
    {
      $project: {
        herarchy: 1,
        _id: 1,
      },
    },
  ]);

  for (let i = 0; i < result.length; i++) {
    category = result[i];
    // let herarchy = category.herarchy;
    let herarchy = category.herarchy.sort(compare);
    let categoryTiers = {};
    let _location = "";
    let flag = true;
    for (let i = 0; i < herarchy.length; i++) {
      let exists = categories.includes(herarchy[i].name);
      if (!exists) flag = false;
    }
    herarchy.map((loc, i) => {
      categoryTiers[`lvl${i}`] = (i == 0) ? _location += loc.name : (i != 0 && i < _location.length - 1) ? _location += " > " + loc.name : _location += " > " + loc.name;
    })
    if (flag) {
      return {
        category: category._id,
        categoryTree: herarchy.map(cat => cat._id),
        categories: { ...categoryTiers },
      }
    }
  }

  return null;

  // return herarchies;
};

const findSubCategories = async (categories, includeParent = true) => {
  if (!categories || !categories.length)
    return {
      status: 400,
      isSuccessfull: false,
      data: null,
      massage: 'CATEGORY_MODULE.CATEGORIES_ARE_NOT_PROVIDED',
    };
  let categoryIds = [];
  for (let i = 0; i < categories.length; i++) {
    let category = categories[i];
    let result = await Category.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(category),
        },
      },
      {
        $graphLookup: {
          from: "categories",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "mainCategory",
          depthField: "depth",
          as: "herarchy",
        },
      },
      {
        $project: {
          "herarchy._id": 1,
          _id: 1,
        },
      },
    ]);
    if (
      result &&
      result.length &&
      result[0].herarchy &&
      result[0].herarchy.length
    ) {
      if (includeParent) categoryIds.push(category.toString());
      categoryIds = categoryIds.concat(
        result[0].herarchy.map((category) => category._id.toString())
      );
    }
  }
  return {
    status: 200,
    isSuccess: true,
    data: categoryIds,
    message: 'SUCCESS',
  };
};

let setAllCategoryCache = async () => {
  let categories = await getAllCategoriesFromDataBase({});
  if (categories) {
    await setCache(categoryEnums.KEYS.ALL_CATEGORIES, undefined, categories, categoryEnums.TTL.FIVE_MIN);
  }
  else return;
}

function compare(a, b) {
  if (a.depth > b.depth) {
    return -1;
  }
  if (a.depth < b.depth) {
    return 1;
  }
  return 0;
}

let categoriesSlug = async (id) => {
  let query = [
    {
      '$graphLookup': {
        'from': 'categories',
        'startWith': '$_id',
        'connectFromField': 'mainCategory',
        'connectToField': '_id',
        'as': 'herarchy',
        'depthField': 'depth'
      }
    }, {
      '$project': {
        'herarchy': 1,
        '_id': 1
      }
    }
  ]

  if (id && typeof id === 'string') {
    query.unshift({
      $match: {
        '_id': mongoose.Types.ObjectId(id)
      }
    })
  }
  if (id && typeof id === 'object') {
    query.unshift({
      $match: {
        '_id': { $in: [id] }
      }
    })
  }

  let categories = await Category.aggregate(query);
  categories = categories.map(elem => {
    let name = "";
    let herarchy = elem.herarchy.sort(compare)
    for (let i = 0; i < herarchy.length; i++) {
      name += name ? `/${herarchy[i].name}` : herarchy[i].name;
    }
    elem.name = name;
    elem.slug = name.toLowerCase().trim().split(' ').join('-').split('&').join('and')
    return elem
  });
  return categories
}

let categorySlugUpdater = async (id = undefined) => {
  let categories = await categoriesSlug(id);
  if (categories.length) {
    categories.forEach(category => {
      updateById(Category, category._id, { slug: category.slug })
    })
  }
  return { isSuccess: true, status: 200, data: null, message: 'CATEGORY_MODULE.CATEGORY_SLUG_UPDATED' }
}
const getAllCateg = async (filter = {}) => {
  return await Category.find(
    filter
  ).select('type name mainImage mainCategory slug');
}

const productInCateg = async () => {
  try {
    const categories = new Map();
    let product = await Category.aggregate([
      {
        '$match': {
          '_id': {
            '$ne': null
          }
        }
      }, {
        '$lookup': {
          'from': 'products',
          'let': {
            'category_id': '$_id'
          },
          'pipeline': [
            {
              '$match': {
                '$expr': {
                  '$eq': [
                    '$category', '$$category_id'
                  ]
                }
              }
            }, {
              '$group': {
                '_id': '$category',
                'count': {
                  '$sum': 1
                }
              }
            }
          ],
          'as': 'result'
        }
      }, {
        '$project': {
          'resultCount': '$result.count',
          'mainCategory': 1
        }
      }, {
        '$unwind': {
          'path': '$resultCount'
        }
      }
    ])
    // let product = await Category.aggregate([
    //   {
    //     "$lookup": {
    //       "from": 'products',
    //       "let": { "category_id": "$_id" },
    //       "pipeline": [
    //         { "$match": { "$expr": { "$eq": ["$category", "$$category_id"] } } },
    //         { "$project": { "_id": 1, "mainCategory": 1 } },
    //       ],
    //       "as": "result"
    //     }
    //   },
    //   { "$project": { "resultCount": { "$size": "$result" }, mainCategory: 1 } }
    // ]);
    if (!product || !product.length)
      throw new ApiError(NOT_FOUND, "categrories has no product.");

    for (let i = 0; i < product.length; i++) {
      const prod = product[i];
      if (!prod.mainCategory) categories.set(prod._id, prod.resultCount);
      if (prod.mainCategory) {
        const categ = categories.get(prod.mainCategory);
        if (!categ)
          categories.set(prod.mainCategory, prod.resultCount);

        if (categ)
          categories.set(prod.mainCategory, categ + prod.resultCount);
        categories.set(prod._id, prod.resultCount);
      }
      console.log(categories);
      // if (product[i] && product[i]._id) {

      //   if (product[i].resultCount > 0) {
      //     updateCategory(product[i]._id, { 'categorySpecs.productsCount': product[i].resultCount, 'categorySpecs.active': true })
      //   }
      //   if (product[i].resultCount <= 0) {
      //     updateCategory(product[i]._id, { 'categorySpecs.active': false, 'categorySpecs.productsCount': product[i].resultCount })
      //   }

      // }

    }
    return { status: 200, message: "category updated successfully.", isSuccess: true, data: null };

  } catch (error) {
    throw new ApiError(BAD_REQUEST, error.message)
  }
}

const updateCategory = async (id, updateBody) => {
  let result = await Category.findByIdAndUpdate(id, updateBody)
  return result;
}



const translateCategories = async (lang = 'ar') => {
  try {
    const Categories = await Category.find({ lang: { $exists: false } }).limit(50000);
    for (let i = 0; i < Categories.length; i++) {
      const category = Categories[i];
      const trans = await translateText({ lang, text: { name: category.name, description: category.description } });
      const tra = {
        lang: {
        }
      }
      tra.lang[lang] = trans;
      const updateCategory = await Category.findByIdAndUpdate(category.id, tra, { new: true });
      console.log(updateCategory);
    }
  } catch (err) {
    throw new ApiError(400, err.message);
  }
}

let addVideoCount = async (body) => {
  let categoryIds = body.categories.categories;
  let delet = false;
  if (body.categories.length)
    delet = body.categories.delete
  let category = await handleCategories(categoryIds)
  if (!category || !category.length)
    return;
  let inc = true;
  if (delet)
    inc = false;
  return await Category.updateMany(
    { _id: { $in: category } },
    { $inc: { videoCount: inc ? 1 : -1 } }
  )
}
let handleCategories = async (categoryIds) => {
  let categories = []
  if (categoryIds && categoryIds.length)
    for (let i = 0; i < categoryIds.length; i++) {
      let category = await getParentIds(categoryIds[i])
      if (category?.length)
        // if (category && Array.isArray(category) && category.length > 0 && category[0].allCategoryIds && Array.isArray(category[0].allCategoryIds) && category[0].allCategoryIds.length > 0) {
        categories.push(...category[0].allCategoryIds);
      // }
    }

  return categories
}

let addAllVideoCount = async (body,) => {
  let categoryIds = body.categories.categories
  let inc = true
  if (body.categories.delete)
    inc = false
  for (let i = 0; i < categoryIds.length; i++) {
    if (categoryIds && categoryIds.length && categoryIds[i]._id && categoryIds[i]._id.length == 24 && categoryIds[i].videoCount) {
      let category = await getParentIds(categoryIds[i]._id)
      if (category && category.length && category[0].allCategoryIds && category[0].allCategoryIds.length) {
        let updateCategories = await Category.updateMany(
          { _id: { $in: category[0].allCategoryIds } },
          { $inc: { videoCount: inc ? categoryIds[i].videoCount : - categoryIds[i].videoCount } }
        )
      }
    }
  }
  return
}
let getParentIds = async (categoryId) => {
  let category = await Category.aggregate([
    {
      "$match": {
        "_id": mongoose.Types.ObjectId(categoryId)
      }
    },
    {
      "$graphLookup": {
        "from": "categories",
        "startWith": "$mainCategory",
        "connectFromField": "mainCategory",
        "connectToField": "_id",
        "as": "hierarchy",
        "depthField": "level"
      }
    },
    {
      "$addFields": {
        "allCategoryIds": {
          "$concatArrays": [
            [{ "$toString": "$_id" }],
            { "$map": { "input": "$hierarchy", "as": "h", "in": { "$toString": "$$h._id" } } }
          ]
        }
      }
    },
    {
      "$project": {
        "allCategoryIds": 1
      }
    }
  ])
  return category
}
const updateManyCategories = async (filter, updateBody) => {
  let result = await Category.updateMany(filter, updateBody)
  return result;
}

const bulkWriteCategories = async (data) => {
  return await Category.bulkWrite(data)
}
const subCategories = async (match) => {
  if (match._id) {
    match._id = new mongoose.Types.ObjectId(match._id)
  }
  const result = await Category.aggregate([
    {
      $match: match
    },
    {
      $graphLookup: {
        from: "categories",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "mainCategory",
        as: "herarchy",
        depthField: "depth"
      }
    },
    {
      $project: {
        herarchy: {
          $filter: {
            input: "$herarchy",
            as: "category",
            cond: {
              $not: {
                $in: [
                  "$$category._id",
                  "$herarchy.mainCategory"
                ]
              }
            }
          }
        }
      }
    }
  ])
  if (!result[0]?.herarchy || !result[0]?.herarchy.length) {
    const cat = await Category.findOne(match)
    if (!cat) throw new ApiError(404, "Category not found")
    return [cat]
  }
  const sub = result[0]?.herarchy
  return sub
}


const findOneCategory = async (filter) => {
  return await Category.findOne(filter)
}

const categoryPathFinder = async (categ, collection) => {
  const childCateg = collection.find(cat => categ == cat);
  const newCollection = collection.filter(cat => categ != cat);
  let categoryId;
  if (!childCateg)
    return;
  await Promise.all(newCollection.map(async (cat) => {

    const category = await findOneCategory({ name: cat });
    if (!category) return;
    if (category && category.type == categoryTypes.SUB) {
      subCategoryName = category.name;
    }
    if (category && category.type == categoryTypes.MAIN_CATEGORY) {
      const subCateg = newCollection.find(cat => cat !== category.name);
      let leafNodeCateg = category?.subCategories.find(sub => sub.name == subCateg);
      if (leafNodeCateg) {
        leafNodeCateg = leafNodeCateg.subCategories?.find(sub => sub.name == categ);
        if (leafNodeCateg)
          categoryId = leafNodeCateg.id;
      }
      console.log(leafNodeCateg, 'leafNodeCateg leafNodeCateg leafNodeCateg')
    }
  }))
  return categoryId;
}
const calculateTree = async (ids) => {
  if (!Array.isArray(ids)) {
    ids = [mongoose.Types.ObjectId(ids)];
  } else {
    ids = ids.map(id => mongoose.Types.ObjectId(id));
  }

  const ancestorsList = await Category.aggregate([
    {
      $match: {
        _id: { $in: ids }
      }
    },
    {
      $graphLookup: {
        from: "categories",
        startWith: "$mainCategory",
        connectFromField: "mainCategory",
        connectToField: "_id",
        as: "ancestors",
        maxDepth: 3,
        depthField: "level",
      },
    },
    {
      $addFields: {
        ancestors: {
          $ifNull: ["$ancestors", []],
        },
      },
    },
    {
      $addFields: {
        ancestors: {
          $let: {
            vars: {
              mainCategories: {
                $filter: {
                  input: "$ancestors",
                  as: "ancestor",
                  cond: { $eq: ["$$ancestor.type", "main"] },
                },
              },
              otherCategories: {
                $filter: {
                  input: "$ancestors",
                  as: "ancestor",
                  cond: { $ne: ["$$ancestor.type", "main"] },
                },
              },
            },
            in: {
              $concatArrays: ["$$mainCategories", "$$otherCategories"],
            },
          },
        },
      },
    },

    {
      $addFields: {
        ancestors: {
          $concatArrays: [
            "$ancestors",
            [{
              _id: "$_id",
              name: "$name",
              level: { $add: [{ $max: "$ancestors.level" }, 1] },
              type: "$type",
            }],
          ],
        },
      },
    },

    {
      $addFields: {
        tree: {
          $reduce: {
            input: "$ancestors",
            initialValue: "",
            in: {
              $cond: {
                if: { $eq: ["$$value", ""] },
                then: "$$this.name",
                else: { $concat: ["$$value", " > ", "$$this.name"] },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        tree: 1,
      },
    },
  ]

  );

  const ancestorsMap = {};
  ancestorsList.forEach(item => {
    ancestorsMap[item._id] = item.tree;
  });

  return ancestorsMap;
}

const getAllCategoryIds = async () => {
  const categories = await Category.aggregate([
    {
      $project: { _id: 1 }
    }
  ]);

  return categories.map(category => category._id);
};

const updateCategories = async (categoryTreeMap) => {
  const bulkOps = Object.entries(categoryTreeMap).map(([id, tree]) => ({
    updateOne: {
      filter: { _id: mongoose.Types.ObjectId(id) },
      update: { $set: { tree } }
    }
  }));

  if (bulkOps.length > 0) {
    await Category.bulkWrite(bulkOps);
  }
};
const createCategoryTrees = async () => {
  try {
    const categoryIds = await getAllCategoryIds();
    const categoryTreeMap = await calculateTree(categoryIds);
    await updateCategories(categoryTreeMap);
    console.log('Categories updated successfully');
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message)
  }
};


const mapAeCategories = async (categoryId, updateBody) => {
  const category = await getCategoryById(categoryId);

  if (updateBody.platformIds.length === 0) {
    updateBody.ae_id = []
    updateBody.platform_specs = []
  }
  if (updateBody.platformIds.length > 0) {
    const leafNodes = await Category.find({ mainCategory: mongoose.Types.ObjectId(categoryId) })
    if (leafNodes.length > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Category Mapping');
    }
    const aeCats = await Category.find({ platformId: { $in: updateBody.platformIds } })
    if (!aeCats || !aeCats.length > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'CATEGORY_NOT_FOUND');
    }
    let ae_id = []
    let platform_specs = []
    for (let i = 0; i < aeCats.length; i++) {
      let aeCat = aeCats[i]
      let catId = aeCat.id ? aeCat.id : aeCat._id
      const subCats = await Category.find({ mainCategory: mongoose.Types.ObjectId(catId) })
      if (subCats.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Category Mapping');
      }
      const alreadyMap = await Category.find({ ae_id: aeCat.platformId })
      if (alreadyMap.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `${aeCat.name} is already mapped against ${alreadyMap[0].name}`);
      }
      ae_id.push(aeCat.platformId)
      platform_specs.push({
        categoryId: aeCat._id,
        platform: aeCat.platform,
        categoryName: aeCat.name
      })
    }
    if (ae_id.length > 0 && platform_specs.length > 0) {
      updateBody.ae_id = ae_id
      updateBody.platform_specs = platform_specs
    }
  }
  delete updateBody.platformIds
  Object.assign(category, updateBody)
  category.save()
  return category

}

const categoryIndex = async (catIndexArr) => {
  try {
    console.log(typeof catIndexArr)
    let update = []
    for (const category of catIndexArr) {
      const { index, categoryId } = category;
      const updateOne = {
        filter: { _id: mongoose.Types.ObjectId(categoryId) },
        update: { $set: { index: index } }
      }
      update.push({ updateOne: updateOne })
    }
    console.log(update)
    await Category.bulkWrite(update)
    return null
  } catch (err) {
    throw new ApiError(httpStatus.BAD_REQUEST, err.message)
  }
}

const allCategories = async (options, filter) => {
  let allCategory
  // console.log(options.sortBy)
  let cacheKey = categoryEnums.KEYS.ALL_CATEGORIES + "v2"
  if (filter.featured)
    cacheKey += "-featured"
  let cacheData = await getCache(cacheKey);
  if (cacheData && cacheData.length > 0) {
    allCategory = cacheData
  } else {
    allCategory = await allCategoriesV2(options, filter)
    setCache(
      cacheKey,
      undefined,
      allCategory,
      categoryEnums.TTL.FIVE_MIN
    );
  }
  return allCategory;
};

const allCategoriesV2 = async (options, filter) => {

  options = sortByParser(options, { index: 1 });
  const matchQuery = {
    'type': 'main',
    'platform': 'bazaarGhar'
  }
  if (filter.featured)
    matchQuery["featured"] = filter.featured;
  let allCategory
  //console.log(options.sortBy)
  allCategory = await Category.aggregate([
    {
      '$match': matchQuery
    }, {
      '$sort': {
        'index': 1
      }
    }, {
      '$project': {
        'name': 1,
        'slug': 1,
        'platform': 1,
        'tree': 1,
        'mainImage': 1,
        'lang': 1,
        'categorySpecs': { 'productsCount': 1 },
        'id': '$_id',
        'featured': 1,
      }
    }, {
      '$lookup': {
        'from': 'categories',
        'let': {
          'categoryId': '$_id'
        },
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$eq': [
                  '$$categoryId', '$mainCategory'
                ]
              }
            }
          }, {
            '$project': {
              'name': 1,
              'slug': 1,
              'platform': 1,
              'tree': 1,
              'mainImage': 1,
              'lang': 1,
              'categorySpecs': { 'productsCount': 1 },
              'id': '$_id',
              "featured":1
            }
          }, {
            '$lookup': {
              'from': 'categories',
              'let': {
                'categoryId': '$_id'
              },
              'pipeline': [
                {
                  '$match': {
                    '$expr': {
                      '$eq': [
                        '$$categoryId', '$mainCategory'
                      ]
                    }
                  }
                }, {
                  '$project': {
                    'name': 1,
                    'slug': 1,
                    'platform': 1,
                    'tree': 1,
                    'mainImage': 1,
                    'lang': 1,
                    'categorySpecs': { 'productsCount': 1 },
                    'id': '$_id',
                    "featured":1
                  }
                }
              ],
              'as': 'subCategories'
            }
          }
        ],
        'as': 'subCategories'
      }
    }
  ])

  return allCategory;
};


module.exports = {
  uploadImages,
  //getPopulatedCategory,
  createCategory,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
  queryCategories,
  getAllCategories,
  getBySlug,
  findByName,
  categoryPicker,
  findSubCategories,
  categoriesSlug,
  categorySlugUpdater,
  getAllCateg,
  productInCateg,
  updateCategory,
  // addCategoryToParent,gi
  translateCategories,
  updateManyCategories,
  bulkWriteCategories,
  // addCategoryToParent,
  // removeCategoryFromParent,
  addVideoCount,
  addAllVideoCount,
  findOneCategory,
  categoryPathFinder,
  createCategoryTrees,
  subCategories,
  createCategoryTrees,
  mapAeCategories,
  categoryIndex,
  allCategories
};  

const httpStatus = require("http-status");
const pick = require("../../utils/pick");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const categoryService = require("./category.service");
const { createBulkCategory } = require("./category.bulk.create")
const en = require('../../config/locales/en')
const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  // res.status(httpStatus.CREATED).send(category);
  res.sendStatus(category)
});

const getCategories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", 'location', "platform"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await categoryService.queryCategories(filter, options);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});

const getAllCategories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "location", "platform", "featured"]);
  const options = pick(req.query, ["sortBy"]);
  const result = await categoryService.getAllCategories(options, filter);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});

const getCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CATEGORY_MODULE.CATEGORY_NOT_FOUND');
  }
  // res.status(httpStatus.OK).send(category);
  res.sendStatus(category);
});

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategoryById(
    req.params.categoryId,
    req.body,

  );

  // res.send(category);
  res.sendStatus(category);
});
const uploadImages = catchAsync(async (req, res) => {

  const category = await categoryService.uploadImages(req.params.categoryId, req.body, req.files);

  // res.status(httpStatus.OK).send(category);
  res.sendStatus(category)
});

const getSlugCategory = catchAsync(async (req, res) => {

  const result = await categoryService.getBySlug(req.params);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});

const deleteCategory = catchAsync(async (req, res) => {

  await categoryService.deleteCategoryById(req.params.categoryId);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus();
});

const findSubCategories = catchAsync(async (req, res) => {

  const result = await categoryService.findSubCategories(req.body.categories);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result.data, result.status, result.message);
});

const categorySlugUpdater = catchAsync(async (req, res) => {
  const result = await categoryService.categorySlugUpdater(req.params.categoryId);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result.data, result.status, result.message);
});

const productInCateg = catchAsync(async (req, res) => {
  const result = await categoryService.productInCateg();
  res.status(httpStatus.OK).send(result);
});
const creatBulkCategory = catchAsync(async (req, res) => {
  const result = await createBulkCategory(req.file);
  res.status(httpStatus.OK).send(result);
});
const categoryTranslator = catchAsync(async (req, res) => {

  const result = await categoryService.translateCategories();
  // res.status(httpStatus.OK).send(result);
  res.sendStatus();
})
const addVideoCount = catchAsync(async (req, res) => {
  const result = await categoryService.addVideoCount(req.body);
  res.sendStatus();
})

const addAllVideoCount = catchAsync(async (req, res) => {
  const result = await categoryService.addAllVideoCount(req.body);
  res.sendStatus();
})
const subCategories = catchAsync(async (req, res) => {
  const result = await categoryService.subCategories(req.query);
  res.status(httpStatus.OK).send(result);
})
const createCategoryTrees = catchAsync(async (req, res) => {
  const result = await categoryService.createCategoryTrees();
  res.sendStatus();
})
const mapAeCategories = catchAsync(async (req, res) => {
  const result = await categoryService.mapAeCategories(req.params.categoryId, req.body);
  res.status(httpStatus.OK).send(result);
})
const categoryIndex = catchAsync(async (req, res) => {
  const result = await categoryService.categoryIndex(req.body.categoriesIndexes);
  res.sendStatus(result);
})

const allCategories = catchAsync(async (req, res) => {
  const options = pick(req.query, ["sortBy", "featured"]);
  const filter = pick(req.query, ["featured"]);
  const result = await categoryService.allCategories(options, filter);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});

module.exports = {
  uploadImages,
  createCategory,
  getCategories,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getSlugCategory,
  findSubCategories,
  categorySlugUpdater,
  productInCateg,
  creatBulkCategory,
  categorySlugUpdater,
  categoryTranslator,
  addVideoCount,
  addAllVideoCount,
  subCategories,
  createCategoryTrees,
  mapAeCategories,
  categoryIndex,
  allCategories
};

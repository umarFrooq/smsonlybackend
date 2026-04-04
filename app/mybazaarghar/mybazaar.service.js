const { wpEndPoints, methods } = require("@/config/enums");
const { wpPost, wpGet, wpUpdate, wpDelete } = require("./mybazaar.utils")
const sanitize = require("@/utils/sanitize");
const en=require('../../config/locales/en')
const createData = async (data) => {
  return await wpPost(data)
}

const getData = async (options, data) => {
  return await wpGet(options, data);
}


/**
 * Batch product operations on mybazaarghar 
 * @param {Object} data  --object of allow fields
 * @param {String} method  --method of operation (post,update,delete)
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const wpBatchProduct = async (data, method) => {
  const options = { url: wpEndPoints.BATCH_PRODUCT, method: method };// my bazaarghar post url
  if (!data || data.lenght <= 0) return { data: null, isSuccess: false, status: 400 };// if no data return null
  let productParse = data;
  if (method === methods.POST || method === methods.UPDATE)// if method is post or update
    productParse = productDataParser(data);// parse data accroding to mybazaarghar format
  if (productParse && productParse.length)
    return await wpPost(options, productParse);// call wp post method to save,update or delete data
  else return { data: null, isSuccess: false, status: 400, message: 'MYBAZAARGHAR_MODULE.NO_RECORD_TO_UPDATE' };
}

/**
 * Update product on mybazaarghar 
 * @param {string}id  --mybazaarghar product id
 * @param {Object} data  --data allows in mybazaarghar
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const wpUpdateProduct = async (id, data) => {
  const options = { url: wpEndPoints.PRODUCT + '/' + id }; // my bazaarghar update url
  return await wpUpdate(options, data); // call wp update method to update data
}

/**
 * get using filters product on mybazaarghar 
 * @param {Object} data  --data allows in mybazaarghar
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const wpGetProduct = async (data) => {
  const options = { url: wpEndPoints.PRODUCT }; // my bazaarghar get url
  return await wpGet(options, data); // call wp get method to get data
}

/**
 * Parsing of data according to mybazaarghar format 
 * @param {Object} data  --data allows in mybazaarghar
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const productDataParser = (data) => {

  if (data && data.length > 0 && Array.isArray(data)) { // if data is array
    return productArrayParser(data);
  }

  else if (data && typeof (data) == 'object') { // if data is object
    return productObjParser(data);
  } else return null;
}

/**
 * Delete product from mybazaarghar
 * @param {String} id  --mybazaarghar product id 
 * @param {Object} data  --data allows in mybazaarghar
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const wpDeleteProduct = async (id, data) => {
  const options = { url: wpEndPoints.PRODUCT + '/' + id }; // my bazaarghar delete url
  return await wpDelete(options, data); // call wp delete method to delete data
}

/**
 * Prase of object type data according to mybazaarghar format
 * @param {Object} data  --data allows in mybazaarghar
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const productObjParser = (data) => {
  // If raw data coming from mongodb
  if (data && (data._doc || data)) {
    if (data && data._doc) {
      data = JSON.stringify(data._doc); //Stringify data in order to parse it in simple json
      data = JSON.parse(data); //Parse data in json
    }

    const galleryImages = data && data.gallery ? data.gallery.map(img => { return { src: img } }) : null; // if gallery images exist

    // Pushing main image to gallery images
    if (galleryImages)
      galleryImages.unshift({ src: data.mainImage });

    // Converting categories objects to array
    const categories = [];
    if (data.categories) {
      for (key in data.categories) {
        categories.push({ name: data.categories[key] });
      }
    }

    // my bazaarghar data format 
    const response = {
      "id": data.id,
      "name": data.productName,
      "slug": data.slug,
      "type": "simple",
      "status": data.hasOwnProperty('active') ? data.active === true ? "publish" : "pending" : null, // if active is true then publish else pending
      // "featured": data.featured,
      "description": data.description,
      "sku": data.sku,
      // "price": data.price,
      "regular_price": data.regularPrice && data.regularPrice.toString(),


      "on_sale": data.onSale,
      "stock_quantity": data.quantity && data.quantity.toString(), // if quantity is not null then convert to string
      "weight": data.weight && data.weight.toString(),

      "categories": categories ? categories : null,
      "tags": data.user && data.user.sellerDetail ? [{ name: data.user && data.user.sellerDetail && data.user.sellerDetail.brandName }] : null, // if brand name exist
      "images": galleryImages ? galleryImages : null, // if gallery images exist


    };
    if (data.salePrice)
      response["sale_price"] = data.salePrice.toString();

    // remove undefined or null values from object
    return sanitize(response);
    // return response;
  } else return null
}

/**
 * Prase of object type data according to mybazaarghar format
 * @param {Object} data  --data allows in mybazaarghar
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const productArrayParser = (data) => {
  const returnArr = [];
  for (let i = 0; i < data.length; i++) { // for each data
    const parseData = productObjParser(data[i]); // parse data according to mybazaarghar format
    if (parseData && Object.keys(parseData).length > 1)
      returnArr.push(parseData);
  }
  return returnArr;
}

module.exports = {
  createData,
  wpGetProduct,
  wpBatchProduct,
  productDataParser,
  wpUpdateProduct,
  wpDeleteProduct
}
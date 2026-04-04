const { csvParser, trimString } = require("@/config/components/general.methods");
const { domainName, aws } = require("@/config/config");
const { catalogHeaders, productTypes, currency, catalogCondition } = require("@/config/enums");
const { responseMethod } = require("@/utils/generalDB.methods.js/DB.methods");
const { findAllProducts, productAggregation } = require("../product/product.service");
const path = require("path");
const S3Util = require("@/config/s3.file.system");
const { getBucketUrl } = require("@/utils/helperFunctions");
const { convert } = require('html-to-text');
const en=require('../../config/locales/en')
const mongoose = require('mongoose');
const { getFbBussinesId, generatePageAccessToken, uploadProductItems, createFbCatalog } = require("../social.token/social.token.service");
const { getUserById } = require("../user/user.service");
const ApiError = require("@/utils/ApiError");
const httpStatus = require("@/node_modules/http-status/lib/index");
const {settValueParser,handleSetting}=require('../setting/setting.service')
/**
 * Create a catalogs for facebook feeds
 
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const createCatalog = async (userId, fbId) => {
  try {
    // Get products
   let  pkr=await handleSetting({"key":"PAKISTAN"})
   
    const products = await productAggregation({
      active: true,
      user: new mongoose.Types.ObjectId(userId),
      productType: productTypes.MAIN,
      // productName: { $exists: true },
      // $and: [
      //   { mainImage: { $exists: true } },
      //   { mainImage: { $ne: null } },
      //   { mainImage: { $ne: "" } },
      //   { description: { $exists: true } },
      //   { description: { $ne: null } },
      //   { description: { $ne: "" } },
      //   { quantity: { $gt: 0 } },
      //   { weight: { $gt: 0 } },
      //   // { $expr: { $gte: [{ $strLenCP: '$productName' }, 149] } }

      // ]
    });

    // product parsing according to the catalog
    const productData = []
    if (products && products.data && products.data.length) {
      const parsedData = products.data.map(prod => {
        // if (products && products.results && products.results.length) {
        //   const parsedData = products.results.map(prod => {

        // description parsing removing html tags
        if (prod.productName) {
          prod.productName = prod.productName.replace(/[^\x00-\x7F]"/g, "");
          if (prod.productName.length > 149)
            prod.productName = trimString(prod.productName, catalogCondition.titleLength);
        }

        let description = prod.description;
        if (prod.description) {
          let desc = prod.description ? convert(prod.description, { wordwrap: false, reserveNewlines: true }) : "";
          desc = desc ? convert(desc, { wordwrap: false }) : "";
          desc = desc.replace(/[\n\r]/g, '');
          description = desc.replace(/[^\x00-\x7F]/g, "");
          console.log(description)
        }

        // catalog parsing

        const catProduct = {
          // id: prod._id.toString(),
          name: prod.productName.toUpperCase(),
          description: description ? description : "",
          mainImage: prod.mainImage ? prod.mainImage.replace(getBucketUrl(), aws.awsCdnHost) : prod.mainImage,
          // price: `${prod.regularPrice} ${currency.Pakistan}`,
          price: `${prod.regularPrice} ${pkr}`,
          link: `${domainName}product/${prod.slug}/`,
          availability: prod.quantity > 0 ? 'in stock' : 'out of stock',
          condition: "new",

          weight: prod.weight,
          quantity: prod.quantity,
          brand: "Bazaarghar",
          currency: currency.Pakistan,
          retailer_id: fbId,
          url: `${domainName}product/${prod.slug}/`,

        };

        if (prod.onSale && prod.salePrice > 0)
          // catProduct["salePrice"] = `${prod.salePrice} ${currency.Pakistan}`;
          catProduct["salePrice"] = `${prod.salePrice} ${pkr}`;
        productData.push(catProduct);
        // return catProduct;
      })
      return { data: productData, isSuccess: true };
      // create csv file

      // const result = await csvParser(catalogHeaders, parsedData, "./public/catalogs/catalog.csv");
      // if (result) {

      //   // Uploading of csv to s3

      //   const upload = new S3Util("catalog.csv", "./public/catalogs/catalog.csv");
      //   const data = await upload.uploadToS3();
      //   return data;

      // }
      // else return responseMethod(400, result, "catalog error.", null);
    } else return responseMethod(400, null, "Products not found.", null);
  } catch (err) {
    return responseMethod(400, false, err, null);
  }
};

const sellerCatalogs = async (userId, body) => {
  const user = await getUserById(userId);
  if (!user)
    throw new ApiError(httpStatus.BAD_REQUEST, "user not found");
  if (!body)
    throw new ApiError(httpStatus.BAD_REQUEST, "Please integrate your shop.");
  const pageToken = await generatePageAccessToken(body.fbToken, body.pageId);
  if (!pageToken.isSuccess)
    throw new ApiError(httpStatus.BAD_REQUEST, pageToken.message);
  if (!body.catalogId) {

    const catalog = await createFbCatalog({ pToken: pageToken.data.access_token, businessId: body.businessId, catalogName: user.sellerDetail.brandName + "Dbazaar" });
    body["catalogId"] = catalog;
  }
  const products = await createCatalog(userId, body.businessId);
  if (!products || !products.isSuccess || !products.data)
    throw new ApiError(httpStatus.BAD_REQUEST, product?.message);
  // const batchData = products.data.map(product => ({
  //   method: 'post',
  //   relative_url: `${body.catalogId}/items`,
  //   body: JSON.stringify(product),
  // }));
  const response = Promise.all(products.data.map(async (product) => {
    const result = await uploadProductItems(pageToken.data.access_token, body.catalogId, product);
    console.log(result);
  })
  )
  
  // return await uploadProductItems(pageToken.data.access_token, body.catalogId, batchData);

}
module.exports = { createCatalog, sellerCatalogs }
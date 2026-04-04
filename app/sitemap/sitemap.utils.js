
const { findAllProducts } = require('@/app/product/product.service');
const { getAllCateg } = require('@/app/category/category.service');
const { productTypes, misc, sitemapTypes } = require('@/config/enums');
const { /* createReadStream, */ createWriteStream, writeFileSync } = require('fs');
const { resolve } = require('path');
const { createGzip } = require('zlib');
const config = require('../../config/config');
const { SitemapAndIndexStream, SitemapStream, } = require('sitemap');
const { getAllStores } = require('../sellerDetail/sellerDetail.service');
const { getAllVideos } = require('../streaming/streaming.service');
const { b247Url, domainName } = require('../../config/config');
const moment = require("moment");
const en=require('../../config/locales/en')
/**
 * Creation of sitemaps files
 * @param {String} fileType - path of file to create
 * @param {String} mainFilePath - main file path
 * @param {Array} data - data of sitemap
 * @returns {Promise<QueryResult>}
 */

const sitemapParsing = async (fileType, mainFilePath, data) => {

  const sms = new SitemapAndIndexStream({
    limit: misc.siteMapLimit, // defaults to 45k,
    lastmodDateOnly: true,
    // SitemapAndIndexStream will call this user provided function every time
    // it needs to create a new sitemap file. You merely need to return a stream
    // for it to write the sitemap urls to and the expected url where that sitemap will be hosted
    getSitemapStream: (i) => {
      const sitemapStream = new SitemapStream({
        hostname: domainName,
      });
      const path = `./public/sitemaps/${fileType}-${i + 1}.xml`;
      const directory = `./sitemaps/${fileType}-${i + 1}.xml`
      const ws = createWriteStream(resolve(path));
      sitemapStream
        // .pipe(createGzip()) // compress the output of the sitemap
        .pipe(ws); // write it to sitemap-NUMBER.xml
      const urlPath = config.env == 'development' ? 'https://apix-stage.bazaarghar.com/' : 'https://apix.bazaarghar.com/';
      // const urlPath = config.env == 'development' ? 'http://localhost:3000/' : 'https://apix.bazaarghar.com/';
      return [
        new URL(directory, urlPath).toString(),
        sitemapStream,
        ws,
      ];
    },
  });

  sms
    // .pipe(createGzip())
    .pipe(createWriteStream(resolve(mainFilePath ? `./public/sitemaps/${mainFilePath}.xml` : './public/sitemaps/sitemap.xml')));

  if (data && data.length) {
    data.forEach((item) => sms.write(item));
    // arrayOfSitemapItems2.forEach((item) => sms.write(item));

    sms.end();
    console.log("index item: ", sms.idxItem);


    return { message: 'SITE_MAP_MODULE.PRODUCT_SITE_MAP_CREATED', status: 200, data: null, isSuccess: true }
  }
  else return { message: 'ArraySITE_MAP_MODULE.NO_PRODUCT_FOUND' , status: 400, data: null, isSuccess: false };
}

/**
 * Creation of sitemaps files
 * @returns {Promise<ResponseMethod>}
 */

const creationOfSiteMaps = async () => {
  try {
    const arrayOfSitemapItems = [];
    const arrayOfSitemapItemsCat = [];
    const storesSitemapItems = [];
    const videosSitemapItems = [];
    let productUrls = 0;
    let videoUrls = 0;
    let storeUrls = 0;
    let categoryUrls = 0;
    let lastMod = moment(new Date()).format("YYYY-MM-DD");

    // Query products to get all products wit active status
    const products = await findAllProducts({ active: true }, { lean: true }, false);
    if (products && products.length) {
      productUrls = Math.ceil(products.length / misc.siteMapLimit);
      products.forEach((prod, ind) => {
        arrayOfSitemapItems.push({ url: `/product/${prod.slug}`, changefreq: 'weekly', lastmod: lastMod });
      });
      // creation of products sitemaps
      sitemapParsing(sitemapTypes.PRODUCT, 'index', arrayOfSitemapItems);
    }

    // Query categories to get all categories 
    const categories = await getAllCateg();
    if (categories && categories.length) {
      categoryUrls = Math.ceil(categories.length / misc.siteMapLimit);
      categories.forEach(prod => { arrayOfSitemapItemsCat.push({ url: `/${prod.slug}?page=1`, changefreq: 'weekly', lastmod: lastMod }); });
      // Creation of categories sitemaps
      sitemapParsing(sitemapTypes.CATEGORY, 'index', arrayOfSitemapItemsCat);
    };

    // Query stores to get all stores
    const stores = await getAllStores();
    if (stores && stores.length) {
      storeUrls = Math.ceil(stores.length / misc.siteMapLimit);
      stores.forEach(prod => { storesSitemapItems.push({ url: `/store/${prod.slug}?page=1`, changefreq: 'weekly', lastmod: lastMod }); });
      sitemapParsing(sitemapTypes.STORE, 'index', storesSitemapItems);
    }

    // Query videos to get all videos
    const videos = await getAllVideos();
    if (videos && videos.isSuccess && videos.data.length) {
      videoUrls = Math.ceil(videos.data.length / misc.siteMapLimit);
      videos.data.forEach(prod => { videosSitemapItems.push({ url: `/video/${prod.slug}`, changefreq: 'weekly', lastmod: lastMod }); });
      sitemapParsing(sitemapTypes.VIDEO, 'index', videosSitemapItems);
    }

    // Generation refrenece of all sitemaps files
    let indexSitemap = indexXmlTextParser(`${b247Url}/sitemaps/`, "product", productUrls)
      + indexXmlTextParser(`${b247Url}/sitemaps/`, "video", videoUrls)
      + indexXmlTextParser(`${b247Url}/sitemaps/`, "store", storeUrls)
      + indexXmlTextParser(`${b247Url}/sitemaps/`, "category", categoryUrls);

    const content = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` + indexSitemap + "</sitemapindex>"
    // console.log(content);

    // creation of sitemap.xml file
    writeFileSync('./public/sitemaps/sitemap.xml', content);
    return { message: 'CREATED_SUCCESSFULLY', status: 200, data: null, isSuccess: true }
  } catch (error) {
    console.log("sitemap error----------: ", error);
    return { message: error.message, status: 400, data: null, isSuccess: false };
  }
}

/**
 * Creation of content of sitemap.xml file
 * @param {String} url
 * @param {String} type
 * @param {Number} ind
 * @returns {Promise<ResponseMethod>}
 */

const indexXmlTextParser = (url, type, ind) => {
  let indexText = "";
  for (let i = 0; i < ind; i++) {
    indexText += `<sitemap><loc>${url}${type}-${i + 1}.xml</loc></sitemap>`
  }
  return indexText;
}
// fs create or update file
module.exports = { sitemapParsing, creationOfSiteMaps }
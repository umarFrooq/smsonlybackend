const slugify = require("slugify");
const cryptoRandomString = require("crypto-random-string");
const joi = require("joi");
const moment = require('moment');
const { responseMethod } = require("../../utils/generalDB.methods.js/DB.methods.js");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const atob = require("atob");
const ApiError = require("../../utils/ApiError");
const { adminDiscountTypes, dataTypes, queryTypes } = require("../enums");
const axios = require('axios');
const httpStatus = require("http-status");
const { encryptionKeys } = require("../config");
const crypto = require('crypto');
// const puppeteer = require('puppeteer');
const mongoose = require('mongoose');

const config = require('../config')
const slugGenerator = (
  name,
  length = 8,
  type = "alphanumeric",
  lower = true,
  isSlug = true,
  includeCrypto = true,
) => {
  let randomString = cryptoRandomString({ length: length, type: type });
  if (name && name.length) {
    //let randomString = cryptoRandomString(8);
    // let _title = title&& title.length? title.replace(" ","-")+"-"+randomString:randomString;
    const slug = slugify(name, {
      replacement: "-", // replace spaces with replacement character, defaults to `-`
      remove: /[`~!@#$%^&*()_|+\-=?;:'",.<>{}\[\]\\\/]/gi, // remove characters that match regex, defaults to `undefined`
      lower: lower, // convert to lower case, defaults to `false`
      strict: true, // strip special characters except replacement, defaults to `false`
      locale: "vi", // language code of the locale to use
    });
    if (isSlug) return slug + "-" + randomString;
    else if (!includeCrypto) return slug;
    else return slug + randomString;
  } else return randomString;
};

const nameSlugGenerator = (name) => {
  if (name) {
    let str = name.split(" ");
    if (str.length == 1)
      return slugGenerator(
        name[0].toUpperCase() + name[1].toUpperCase(),
        6,
        "numeric",
        false,
        false
      );
    else if (str.length >= 2) {
      var matches = name.match(/\b(\w)/g);
      return slugGenerator(
        matches[0].toUpperCase() + matches[1].toUpperCase(),
        6,
        "numeric",
        false,
        false
      );
    }
  } else return name;
};

const dataValidator = (data, schema, errorMessage, status) => {
  // const schema = Joi.object().keys({
  //   id: Joi.number().integer(),
  //   name: Joi.string().min(3).max(30).required(),
  //   price: Joi.number().precision(2).required()
  // });
  const { error } = Joi.validate(data, schema);
  if (error) {
    return { isSuccess: false, message: errorMessage ? errorMessage : 'GENERAL_METHED_MODULE.VALIDATE_ERROR', status: status ? status : 400, data: null };
  }
  return { isSuccess: true, message: 'GENERAL_METHED_MODULE.VALIDATE_SUCCESSFULLY', status: status ? status : 200, data: null };
}

const removeSpaces = (str) => {
  return str.replace(/\s/g, "");
}


const timeRemainingParser = (startDate = null, endDate = null) => {
  let now;
  let then;
  if (startDate && endDate) {
    now = moment(startDate, 'MM DD YYYY, h:mm a');
    then = moment(endDate, 'MM DD YYYY, h:mm a');
  } else if (!startDate && endDate) {
    then = moment(endDate, 'MM DD YYYY, h:mm a');
    now = moment();
  } else if (startDate && !endDate) {
    now = moment();
    then = moment(endDate, 'MM DD YYYY, h:mm a');
  } else return null;
  if (now && then) {
    // const then = moment(end, 'MM DD YYYY, h:mm a');
    // const now = moment()

    if (then > now) {
      let obj = {}
      let duration = moment.duration(then.diff(now))
      let days = Math.abs(duration.get('days'));
      let minutes = Math.abs(duration.get('minutes'));
      let hours = Math.abs(duration.get('hours'));
      obj = { days, minutes, hours }
      return obj;
    }
  } else return null;
}

/**
 * CSV file parser
 * @param {Array} headers  headers of CSV file 
 * @param {Array} data  data of CSV file 
 * @param {String} path  local path to save CSV file
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */
const csvParser = async (headers = [], data = [], path = "") => {
  if (data && headers && path) {
    const csvWriter = createCsvWriter({
      header: headers,
      path: path
    });
    const records = data;

    return csvWriter.writeRecords(records)       // returns a promise
      .then((result) => {
        console.log('...Done');
        return true;
      }).catch(err => {
        console.log(err);
        return false;
      })
  } else return false;


}

/**
 * Convet html content to pdf buffer
 * @param {HTML} hmtl  content in html format
 * @returns {Buffer} return buffer of pdf file generated from html content
 */

// const convertHtmlToPDF = async (html, options = {}) => {
//   if (html && html.length) {
//     return new Promise((resolve, reject) => {

//       // Generating pdf

//       html_to_pdf.create(html, options).toBuffer(async function (err, pdfBuffer) {
//         if (pdfBuffer)
//           resolve(pdfBuffer);
//         if (err) {
//           console.log(err)
//           reject(null);

//         }
//       });
//     })
//   } else return null;
// }
// const convertHtmlToPDF = async (html, options = {}) => {
//   if (html && html.length) {
//     try {
//       const browser = await puppeteer.launch();
//       const page = await browser.newPage();
//       await page.setContent(html, { waitUntil: 'networkidle0' });

//       const pdfBuffer = await page.pdf({
//         format: options.format || 'A4',
//         printBackground: options.printBackground || true,
//         ...options,
//       });

//       await browser.close();
//       return pdfBuffer;
//     } catch (err) {
//       console.error('Error generating PDF:', err);
//       return null;
//     }
//   } else {
//     return null;
//   }
// };


const trimString = (string, to, from = 0) => {
  if (string && string.length) {
    return string.substring(from, to);
  }
  return string;
}
const JwtDecoder = (token) => {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

/**
 * Get Random number 
 * @param {Number} min --min range from number should start
 * @param {Number} max --maximux
 * @returns {Number}
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

const dateFilter = (filter) => {
  if (filter && (filter.to || filter.from)) {
    const { to, from } = filter;
    if (to && new Date(to).getTime() > new Date().getTime())
      throw new ApiError(400, 'TO_DATE_CANNOT_BE_GREATER_THAN_TODATE');
    if (from && new Date(from).getTime() > new Date().getTime())
      throw new ApiError(400, 'TO_DATE_CANNOT_BE_GREATER_THAN_TODATE');
    if (to && from && new Date(to).getTime() < new Date(from).getTime())
      throw new ApiError(400, 'FROM_DATE_CANNOT_BE_GREATER_THAN_TODATE');
    if (to && from) {
      Object.assign(filter, { createdAt: { $gte: new Date(from), $lte: new Date(to) } });
    } else if (to && !from) {
      Object.assign(filter, { createdAt: { $lte: new Date(to) } });
    } else if (!to && from) {

      Object.assign(filter, { createdAt: { $gte: new Date(from) } });
    }
    delete filter.from;
    delete filter.to;
    return filter;
  }
  else return filter;
}
const isObjectId = value => value.match(/^[0-9a-fA-F]{24}$/)
function sortByParser(option) {
  let sort = {};
  if (option.sortBy) {
    if (option.sortBy.includes("-")) {
      const sortBy = option.sortBy.replace("-", "");
      sort[sortBy] = -1
    } else sort[option.sortBy] = 1;
    option.sortBy = sort;
  }
  return option
}

const getDiscount = (discount_amount, total_amount, discount_type, quantity) => {
  let amount = total_amount;
  if (discount_type === adminDiscountTypes.PERCENTAGE) {
    amount = total_amount * (discount_amount / 100);
    if (quantity) amount = quantity * amount;
  }
  else amount = quantity ? quantity * discount_amount : discount_amount;
  return amount;
}
function checkHeaders(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}

/**
 * Updates the language data object with new values from the given language object.
 *
 * @param {Object} lang - The language object containing new values.
 * @param {Object} data - The language data object to be updated.
 * @return {Object} The updated language data object.
 */

const updateLangData = (lang, data) => {
  if (!data || !Object.values(data).length) {
    data = lang;
    return data;
  }
  for (const key in lang) {
    if (lang.hasOwnProperty(key)) {
      const lang1 = lang[key];
      if (!data.hasOwnProperty(key)) {
        data[key] = lang[key];
      }
      else {
        for (const key1 in lang1) {
          if (lang1.hasOwnProperty(key1)) {
            data[key][key1] = lang1[key1];
          }
        }
      }
    }
  }
  return data;
}

const dataTypeParser = (dataType, value) => {
  if (dataType == dataTypes.NUMBER) {
    const result = numberValid(value);
    if (result) {
      return Number.parseFloat(value);
    }
    else return value
  } else return value;
}
const numberValid = (value) => {
  try {
    if (isNaN(value))
      return false
    return true;
  } catch (err) {
    return false;
  }
}


/**
 * Parses the langData and updates the body with the provided image and key.
 *
 * @param {object} langData - The language data to be parsed and updated
 * @param {object} updateBody - The body to be updated with the image and key
 * @param {string} image - The image to be added to the body
 * @param {string} key - The key to be used for the image in the body
 * @return {object} The updated language data
 */

const langImageParser = (langData, updateBody, image, key) => {
  let lang = {};
  if (!langData) {
    lang[updateBody.lang] = {

    }
    lang[updateBody.lang][key] = image;
  }
  if (langData && !langData[updateBody.lang]) {
    lang = langData;
    lang[updateBody.lang] = {

    }
    lang[updateBody.lang][key] = image;
  }
  if (langData && langData[updateBody.lang]) {
    lang = langData;
    lang[updateBody.lang][key] = image;
  }
  return lang;
}
const queryTypeParser = (query, path, type = queryTypes.TEXT) => {

  switch (type) {
    case queryTypes.TEXT:
      return {
        text: {
          query: query,
          path: path
        }
      }

    case queryTypes.EXISTS:
      return {
        exists: {
          path
        }
      }
    case queryTypes.EQUALS:
      return {
        equals: {
          path: path,
          value: query
        }
      }
    case queryTypes.MUST_NOT:
      return {
        exists: {
          path
        }
      }
    case queryTypes.RANGE:
      return {
        range: query
      }
    case queryTypes.IN:
      return {
        in: {
          path: path,
          value: query
        }
      }
  }


}


let atlasQueryTypeValidation = (result) => {
  const compoundQuery = {};
  if (result?.filterQuery?.length)
    compoundQuery['filter'] = result.filterQuery;
  if (result?.mustQuery?.length)
    compoundQuery['must'] = result.mustQuery;
  if (result?.mustNot?.length)
    compoundQuery['mustNot'] = result.mustNot;
  if (result?.shouldQuery?.length)
    compoundQuery['should'] = result.shouldQuery;
  console.log(JSON.stringify(compoundQuery));
  return compoundQuery
}

const filterResponse = (result, pagination, options) => {
  const totalResult = result?.length ? result[0].meta?.count?.total : 0
  const totalPages = result?.length ? Math.ceil(totalResult / pagination.limit) : 0
  const response = {
    "page": options.page || 1,
    "totalPages": totalPages,
    "limit": options.limit || 10,
    "totalResult": totalResult,
    "results": result?.length ? result : []
  }
  return response
}
const dateValidation = (filter) => {
  if (filter && (filter.to || filter.from)) {
    const { to, from } = filter;
    if (to && new Date(to).getTime() > new Date().getTime())
      throw new ApiError(400, "to date cannot be greater than today");
    if (from && new Date(from).getTime() > new Date().getTime())
      throw new ApiError(400, "to date cannot be greater than today");
    if (to && from && new Date(to).getTime() < new Date(from).getTime())
      throw new ApiError(400, "from date cannot be greater than to date");
  }
}
const setAtasDateCondition = (filter) => {
  dateValidation(filter);
  if (filter && (filter.to || filter.from)) {
    const { to, from } = filter;
    if (to && from) {
      Object.assign(filter, { createdAt: { gte: new Date(from), lte: new Date(to) } });
    } else if (to && !from) {
      Object.assign(filter, { createdAt: { lte: new Date(to) } });
    } else if (!to && from) {

      Object.assign(filter, { createdAt: { gte: new Date(from) } });
    }
    delete filter.from;
    delete filter.to;
    return filter;
  }
  else return filter;
}
const axiosUtils = (_data, _option) => {
  const options = {
    method: _option.method,
    headers: _option.headers ? _option.headers : { "Accept": "*/*" },
    url: _option.url
  }
  if (!_option.headers["Content-Type"])
    _option.headers["Content-Type"] = 'application/json'
  if (_option.method == "POST" || _option.method == "PUT" || _option.method == "PATCH") {
    if (_data)
      options["data"] = _data;
  }
  if (_option.query)
    options["params"] = _option.query;
  return axios(options)
    .then(result => {
      return { result: result ? result && result.data : null, message: result.message, isError: false };
    }).catch(async (err) => {

      throw new ApiError(httpStatus.BAD_REQUEST, err && err.response && err.response.data && err.response.data.message && err.response.data.message.length ? err.response.data.message : "Bad request");
    })
};


const secondsToDate = (seconds) => {
  const days = Math.floor(seconds / (24 * 3600));
  return `${days}`;
}
const numberRounder = (number, toRound = 2) => {
  let result = parseFloat(number.toFixed(toRound))
  return result
}
const ALGORITHM = 'aes-256-cbc'
const ENC_KEY = Buffer.from(encryptionKeys.apiKeyEncKey, "hex");
const ENC_KEY_IV = Buffer.from(encryptionKeys.apiKeyEncKeyIV, "hex");
const decryptionFunction = (data) => {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, ENC_KEY, ENC_KEY_IV);
    let decryptedData = decipher.update(data, "base64", "utf-8");
    decryptedData += decipher.final("utf8");
    return decryptedData;

  } catch (error) {
    console.log(error);
  }
}

const encryptionFunction = (data) => {
  try {
    const cipher = crypto.createCipheriv(ALGORITHM, ENC_KEY, ENC_KEY_IV);
    let encryptedData = cipher.update(data, "utf-8", "base64");
    encryptedData += cipher.final("base64")
    return encryptedData;

  } catch (error) {
    console.log(error);
  }
}
const apiUtils = (_data, _option) => {
  const options = {
    method: _option.method,
    headers: _option.headers ? _option.headers : { "Accept": "*/*" },
    url: _option.url
  }
  if (!_option.headers["Content-Type"])
    _option.headers["Content-Type"] = 'application/json'
  if (_option.method == "POST" || _option.method == "PUT" || _option.method == "PATCH") {
    if (_data)
      options["data"] = _data;
  }
  if (_option.query)
    options["params"] = _option.query;
  return axios(options)
    .then(result => {
      return { result: result, message: result.message, isError: false };
    }).catch(async (err) => {

      return { data: err, isError: true };
    })
}

const isValidJSON = (data) => {
  try {
    return JSON.stringify(data);
  } catch (err) {
    return null;
  }
}


function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (!target[key] || !(target[key] instanceof Object)) {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}


const removeUserData = (product) => {
  const sellerDetail = { id: product?.user?.id, sellerDetail: {} }
  product = JSON.parse(JSON.stringify(product));
  if (product.user && product.user.sellerDetail) {
    const seller = product.user.sellerDetail;
    sellerDetail.sellerDetail = { id: seller.id, slug: seller.slug, brandName: seller.brandName, logo: seller.logo, images: seller.images };
  }
  return product.user = sellerDetail;
}

/**
 * Calculate the total quantity of variants in a product.
 * @param {Object} variants - Array of variant objects in a product
 * @return {Number} total quantity of the product
 */
const variantsQuantity = (variants) => {
  let quantity = 0;
  if (!variants || !variants.length) return quantity;

  return variants.reduce((total, variant) => {
    return total += variant.quantity ? variant.quantity : 0;
  }, 0);
}

const returnFilter = (filter) => {
  if (!filter)
    filter = {}
  Object.assign(filter, { _id: { $ne: null } })
  return filter;


}
const calculatePercentage = (value, percentage,denom=100) => {
  const percentageValue = parseFloat(percentage);
  if (isNaN(percentageValue)) {
    throw new Error("Invalid percentage: Percentage must be a valid number.");
  }

  const valueNumber = parseFloat(value);
  if (isNaN(valueNumber)) {
    throw new Error("Invalid value: Value must be a valid number.");
  }
  const result = (valueNumber * percentageValue) / denom;
  return Math.round(result * 100) / 100;
};
let setPremiumAmount = (product, basePriceData) => {
  let { amount, origin } = product
  let { shipmentCharges, premiumPercentage, forex } = basePriceData
  if (origin == regions.KSA)
    return shipmentCharges
  premiumPercentage = calculatePercentage(amount, premiumPercentage)
  forex = calculatePercentage(amount, forex)
  if (origin == regions.PAK)
    return Math.round(((premiumPercentage + shipmentCharges + forex)) * 100) / 100
  return 0

}
/**
 * Parse filter object values to ObjectId if the property is present in the given array of properties.
 * @param {Array<String>} props - Array of property names which values should be parsed to ObjectId.
 * @param {Object} filter - Filter object which values should be parsed.
 * @return {Object} Filter object with ObjectId values.
 */
const parsetoObjectId = (props, filter) => {
  if (!filter || !Object.keys(filter).length)
    return filter;
  props.forEach(item => {
    if (filter[item])
      filter[item] = new mongoose.Types.ObjectId(filter[item])
  });
  return filter;
}

const currencyConverter = async (from, to, amount) => {
  const query = {
    from,
    to,
    amount,
  };
  try {
    let options = {
      method: 'GET',
      url: config.apilayerUrl,
      headers: {
        apiKey: config.apilayerKey,
      },
      query
    };

    const response = await axiosUtils(null, options);
    return response.
      result.result
  } catch (err) {
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  }
};
let parseCurrency = (amount, conversionRate) => {
  if (!amount)
    return 0
  if (!conversionRate)
    return amount
  amount = parseFloat(amount)
  return parseFloat((amount *conversionRate).toFixed(2))
}
module.exports = {
  slugGenerator,
  nameSlugGenerator,
  dataValidator,
  removeSpaces,
  timeRemainingParser,
  csvParser,
  // convertHtmlToPDF,
  trimString,
  getRandomInt,
  JwtDecoder,
  dateFilter,
  getDiscount,
  isObjectId,
  updateLangData,
  checkHeaders,
  langImageParser,
  dataTypeParser,
  secondsToDate,
  numberRounder,
  queryTypeParser,
  atlasQueryTypeValidation,
  filterResponse,
  dateValidation,
  setAtasDateCondition,
  secondsToDate,
  axiosUtils,
  apiUtils,
  isValidJSON,
  decryptionFunction,
  encryptionFunction,
  deepMerge,
  calculatePercentage,
  setPremiumAmount,
  variantsQuantity,
  parsetoObjectId,
  removeUserData,
  variantsQuantity,
  returnFilter,
  setPremiumAmount,
  parsetoObjectId,
  sortByParser,
  currencyConverter,
  parseCurrency
};


/**
 * Vintega Solutions
 *
 * Utility to integaerate wocommerce, it encapsulates all wp API related methods.
 */


const { wps } = require('@/config/config');
const { methods } = require('@/config/enums');
var WooCommerceAPI = require("woocommerce-api");

// WooCommerce Api configurations-------
var wooCommerce = new WooCommerceAPI({
  url: wps.url,
  consumerKey: wps.consumerKey,
  consumerSecret: wps.consumerSecret,
  wpAPI: true,
  version: 'wc/v1'
});
// WooCommerce Api configurations---------

/**
 * Get data from wp
 * @param {Object} options  --options include url, method
 * @param {String} query  --Query string
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const wpGet = async (options, query) => {

  // query validation
  query = query ? query : '';

  // Promise to get data from wp
  const prom = new Promise((resolve, reject) => {

    // WooCommerce API call
    wooCommerce.getAsync(options.url + query).then(result => {
      if (result && result.statusCode === 200 && result.body) {

        // data return from woocommerce api
        resolve({ data: JSON.parse(result.body), isSuccess: false, status: result.statusCode });
      } else reject({ data: null, isSuccess: false, status: result.statusCode });

    }).catch(err => {
      console.log(err);
      reject({ data: err, isSuccess: false, status: result.statusCode });
    })
  })

  return await prom;
  // console.log(resp);
}

/**
 * Post batch data to wp it include batch operation allowed in wp (update,delete,create)
 * @param {Object} options  --options include url, method
 * @param {Object} data  --data allowed in wp
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const wpPost = async (options, data) => {

  // Parsing data according to methods 
  if (options.method === methods.POST)
    data = { create: data };
  if (options.method === methods.UPDATE)
    data = { update: data };
  if (options.method === methods.DELETE)
    data = { delete: data };

  // Promise to perform batch operations 
  const prom = new Promise((resolve, reject) => {
    wooCommerce.postAsync(options.url, data

    ).then(result => {
      if (result && result.statusCode === 200 && result.body) {
        // console.log(result.statusCode, result.body);
        resolve({ data: JSON.parse(result.body), isSuccess: false, status: result.statusCode });
      } else reject({ data: null, isSuccess: false, status: result.statusCode });
    }).catch(err => {
      reject({ data: err, isSuccess: false, status: result.statusCode });
    })

  })

  const resp = await prom;
  console.log(resp);

}

/**
 * Update data on wp
 * @param {Object} options  --options include url, method
 * @param {Object} data  --data allowed in wp
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const wpUpdate = async (options, data) => {

  // Promise to perform batch operations 

  const prom = new Promise((resolve, reject) => {
    wooCommerce.putAsync(options.url, data

    ).then(result => {
      if (result && result.statusCode === 200 && result.body) {
        console.log(result.statusCode, result.body);
        resolve({ data: JSON.parse(result.body), isSuccess: false, status: result.statusCode });
      } else reject({ data: null, isSuccess: false, status: result.statusCode });
    }).catch(err => {
      reject({ data: err, isSuccess: false, status: result.statusCode });
    })

  })
  await prom;

}

/**
 * delete data on wp
 * @param {Object} options  --options include url, method
 * @param {Object} data  --data allowed in wp
 * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */

const wpDelete = async (options, data) => {

  // Promise to perform batch operations 
  const prom = new Promise((resolve, reject) => {
    wooCommerce.deleteAsync(options.url, data

    ).then(result => {
      if (result && result.statusCode === 200 && result.body) {
        console.log(result.statusCode, result.body);
        resolve({ data: JSON.parse(result.body), isSuccess: false, status: result.statusCode });
      } else reject({ data: null, isSuccess: false, status: result.statusCode });
    }).catch(err => {
      reject({ data: err, isSuccess: false, status: result.statusCode });
    })

  })
  return await prom;
}

module.exports = {
  wpPost,
  wpGet,
  wpUpdate,
  wpDelete
}
const { socialMedia } = require('@/config/enums');
const SocialToken = require("./social.token.model");
const { facebook } = require('@/config/config');
const ApiError = require('@/utils/ApiError');
const httpStatus = require('@/node_modules/http-status/lib/index');
const axios = require('axios');
const FB = require('fb');
const { getUserById } = require('../user/user.service');
/**
 * Creates a social token based on the provided body.
 *
 * @param {object} body - The body object containing userId and socialMedia.
 * @return {Promise<any>} The updated token if it exists, otherwise the newly created token. Returns null if an error occurs.
 */

const createSocialToken = async (body) => {
  try {
    const token = await getOneSocialToken({ userId: body.userId, socialMedia: body.socialMedia });
    if (token)
      return await updateTokenById(token.id, body);
    if (!token)
      return await createToken(body);
    return null;
  } catch (err) {
    console.log("create social token", err);
    return null;
  }
}

/**
 * Retrieves a single social token based on the provided filter.
 *
 * @param {Object} filter - The filter to apply when searching for the social token.
 * @return {Promise} A promise that resolves to the found social token.
 */
const getOneSocialToken = async (filter) => {
  return await SocialToken.findOne(filter);
}

/**
 * Updates a token by its ID.
 *
 * @param {string} id - The ID of the token to be updated.
 * @param {object} body - The new data to be updated.
 * @return {Promise<object>} - The updated token.
 */

const updateTokenById = async (id, body) => {
  return await SocialToken.findByIdAndUpdate(id, body);
}

/**
 * Creates a token asynchronously.
 *
 * @param {Object} body - The body of the token.
 * @return {Promise} A promise that resolves to the created token.
 */

const createToken = async (body) => {
  return await SocialToken.create(body);
}

/**
 * Retrieves social tokens based on the provided filter.
 *
 * @param {Object} filter - The filter to apply when searching for social tokens.
 * @return {Promise<Array>} - A promise that resolves to an array of social tokens.
 */

const findSocialTokens = async (filter) => {
  return await SocialToken.find(filter);

}

/**
 * Long Token
 * @param {String} token - Facebook Token
 * @returns {Promise<QueryResult>}
 */
const fbLongToken = async (token, userId) => {

  if (token) {
    return axios.get(`https://graph.facebook.com/oauth/access_token?client_id=${facebook.clientId}&client_secret=${facebook.secretKey}&grant_type=fb_exchange_token&fb_exchange_token=${token}`)
      .then(result => {
        updateAndCreateLongTokenFB(result.data, userId)
        return { message: "Generated successfuly", status: 200, isError: false, result: result.data };
      }).catch(err => {
        return { message: en.SERVER_ERROR, status: 400, isError: true, result: {} };
      })
  } else
    return { message: en.TOKEN_NOT_FOUND, status: 500, isError: true, result: {} };

}
/**
 * Updates and creates a long token for Facebook.
 *
 * @param {object} data - The data containing the access token.
 * @param {string} userId - The ID of the user.
 * @return {object} An object indicating the success and message of the operation.
 */
const updateAndCreateLongTokenFB = async (data, userId) => {
  try {
    if (data && data.access_token) {
      const tokenPayload = {
        token: data.access_token,
        userId
      }
      await createSocialToken(tokenPayload)
    }
  } catch (err) {
    return { isSuccess: false, message: err.message }
  }
}

/**
 * Refreshes the Facebook access token.
 *
 * @param {object} body - The request body containing the token and userId.
 * @return {object} The refreshed access token.
 */
const fbRefreshToken = async (body) => {
  const result = await fbLongToken(body.token, body.userId);
  if (!result || !result.isSuccess || !result.data)
    throw new ApiError(httpStatus.BAD_REQUEST, result.message);
  return result.data;
}

/**
 * Long Token
 * @param {String} token - Facebook Token
 * @returns {Promise<QueryResult>}
 */
const getFbBussinesId = async (token) => {


  return axios.get(`https://graph.facebook.com/v13.0/me?fields=id,name,businesses&access_token=${token}`)
    .then(result => {
      return result.data;
      // updateAndCreateLongTokenFB(result.data, userId)
      // return { message: "Generated successfuly", status: 200, isError: false, result: result.data };
    }).catch(err => {
      throw new ApiError(httpStatus.BAD_REQUEST, err.message)
    })


}

/**
 * Generation of page token
 * @param {String} token - facebookToken
 * @param {String} pageId - facebook user pageId
 * @returns {Promise<QueryResult>}
 */

const generatePageAccessToken = async (token, pageId) => {
  const fbPage = new Promise(function (resolve, reject) {
    // FB.api(`${groupId}/live_videos?access_token=${token}&description=${descriptions}&title=${metaData.title}`, 'post').then(result => {
    FB.api(`${pageId}/?fields=access_token&access_token=${token}`, 'get').then(result => {
      resolve(result)
    }).catch(err => {
      reject(err);
    })
  })
  return await fbPage.then(result => {
    console.log(result);
    return { data: result, message: "", status: 200, isSuccess: true };
  }).catch(err => {
    return { data: null, message: err, status: 200, isSuccess: false };
  })

}
/**
 * List of facebook user pages
 * @param {Object} body - {userId:"facebookuserId",token:"facebookToken"}
 * @param {Object} user - user from authentication
 * @returns {Promise<QueryResult>}
 */

const getUserPageList = async (params, user) => {
  // if (user && user.role == "supplier") {

  const fbPage = new Promise(function (resolve, reject) {

    // FB.api(`${groupId}/live_videos?access_token=${token}&description=${descriptions}&title=${metaData.title}`, 'post').then(result => {
    FB.api(`${params.userId}/accounts/?access_token=${params.fbToken}`, 'get').then(result => {
      resolve(result)
    }).catch(err => {
      reject(err);
    })
  })
  return await fbPage.then(async (result) => {

    let pageList = []
    if (result) {
      result.data.map((page) => {
        pageList.push({ id: page.id, name: page.name })
      });

    }
    // const token = await generatePageAccessToken(pageList[0].id, body.token);
    // console.log(token);
    return pageList;
  }).catch(err => {
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  })
  // } else return { status: 401, message: en.USER_NOT_AUTHORIZED, isSuccess: false, data: null };
}
// /**
//  * Long Token
//  * @param {String} token - Facebook Token
//  * @returns {Promise<QueryResult>}
//  */
// const getFbBussinesId = async (token) => {

//   if (token) {
//     return axios.get(`https://graph.facebook.com/v13.0/me?fields=id,name,businesses&access_token=${token}`)
//       .then(result => {
//         // updateAndCreateLongTokenFB(result.data, userId)
//         return { message: "Generated successfuly", status: 200, isError: false, result: result.data };
//       }).catch(err => {
//         return { message: en.SERVER_ERROR, status: 400, isError: true, result: {} };
//       })
//   } else
//     return { message: en.TOKEN_NOT_FOUND, status: 500, isError: true, result: {} };

// }
const createFbCatalog = async (payload) => {
  return axios.post(
    `https://graph.facebook.com/v13.0/${payload.businessId}/owned_product_catalogs`,
    {
      name: payload.catalogName,
      vertical: 'commerce',
      // Add other catalog attributes
    },
    {
      params: {
        access_token: payload.pToken,
      },
    }
  )
    .then(response => {
      return response.data.id;

      // Proceed to the next step (uploading product items)
      // uploadProductItems(pageAccessToken, catalogId);
    }).catch(err => {
      throw new ApiError(httpStatus.BAD_REQUEST, err.message)
    })
}
const sellerCatalogs = async (userId, body) => {
  const user = getUserById(userId);
  if (!user)
    throw new ApiError(httpStatus.BAD_REQUEST, "user not found");
  if (!user.body)
    throw new ApiError(httpStatus.BAD_REQUEST, "Please integrate your shop.");
  const pageToken = await generatePageAccessToken(body.pageId, body.token);
  if (!pageToken.isSuccess)
    throw new ApiError(httpStatus.BAD_REQUEST, pageToken.message);
  if (!body.catalogId) {

    const catalog = await createCatalog({ pToken: pageToken.data, businessId: body.businessId, catalogName: user.sellerDetail.brandName + "Dbazaar" });
    body["catalogId"] = catalog;
  }
  await uploadProductItems(pageToken.data, body.catalogId);
}

async function uploadProductItems(pageAccessToken, catalogId, products) {
  console.log(products)
  return axios.post(
    `https://graph.facebook.com/v13.0/${catalogId}/products`,
    products,
    {
      params: {
        access_token: pageAccessToken,
      },
    }
  )
    .then(uploadResponse => {
      return uploadResponse.data;

      // Proceed to the next step (linking catalog to shop)
      // linkCatalogToShop(pageAccessToken, catalogId);
    })
    .catch(error => {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
      console.error('Error uploading catalog items:', error.response.data);
    });
}

function linkCatalogToShop(pageAccessToken, catalogId) {
  axios.post(
    `https://graph.facebook.com/v13.0/me/shops`,
    {
      access_token: pageAccessToken,
      catalog_id: catalogId,
      // name: 'Your Shop Name',
      // Add other shop details
    }
  )
    .then(linkResponse => {
      console.log(linkResponse.data);
    })
    .catch(error => {
      console.error('Error linking catalog to shop:', error.response.data);
    });
}
module.exports = {
  getOneSocialToken,
  createSocialToken,
  createToken,
  findSocialTokens,
  fbLongToken,
  fbRefreshToken,
  getFbBussinesId,
  sellerCatalogs,
  generatePageAccessToken,
  createFbCatalog,
  uploadProductItems,
  getUserPageList
}
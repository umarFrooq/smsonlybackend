const { addStoreToProduct, productRegions } = require("../product/product.service")

/**
 * Asynchronously adds a store to a product.
 *
 * @param {any} productRemove - The product to remove.
 * @param {any} userId - The user ID.
 * @param {any} images - The images to add.
 * @return {Promise<Object>} A promise that resolves to an object with success message, status, success indicator, and data.
 */

const productStore = async (productRemove, userId, images) => {
  try {
    await addStoreToProduct(productRemove, userId, images);
    return { message: "success", status: 200, isSuccess: true, data: null };
  } catch (err) {
    console.log("add store to products err: ", err);
    return { message: err.message, status: 500, isSuccess: false, data: null };
  }
}

/**
 * Updates the regions of a product using the provided body.
 *
 * @param {Object} body - The data containing the product ID and the new regions.
 * @return {Promise<Object>} - A promise that resolves to the result of the productRegions function.
 */

const updateProductRegions = async (body) => {
  return await productRegions(body);
}
module.exports = {
  productStore,
  updateProductRegions
}
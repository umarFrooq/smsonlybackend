/**
 * @class ApiError
 * @extends {Error}
   * Creates an instance of ApiError.
   * @param {number} statusCode
   * @param {string} message
   * @param {boolean} [isOperational=true]
   * @param {string} [stack='']
   * @memberof ApiError
*/
class ApiErrors extends Error {
    constructor(statusCode, message, isOperational = true, data = '',isSuccess=false) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      this.isSuccess = isSuccess;
      if (data) {
        this.data = data;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  module.exports = ApiErrors;
  
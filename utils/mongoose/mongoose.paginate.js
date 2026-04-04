/* eslint-disable no-param-reassign */

const paginate = (schema) => {
  /**
   * @typedef {Object} QueryResult
   * @property {Document[]} results - Results found
   * @property {number} page - Current page
   * @property {number} limit - Maximum number of results per page
   * @property {number} totalPages - Total number of pages
   * @property {number} totalResults - Total number of documents
   */
  /**
   * Query for documents with pagination
   * @param {Object} [filter] - Mongo filter
   * @param {Object} [options] - Query options
   * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
   * @param {number} [options.limit] - Maximum number of results per page (default = 10)
   * @param {number} [options.page] - Current page (default = 1)
   * @param {Array} [options.removeVirtuals] - remove virtual fields
   * @param {Array} [options.select] - selected fields of schema
   * @returns {Promise<QueryResult>}
   */
  schema.statics.paginate = async function (filter, options) {
    //const sort = {};
    let sort = '';
    if (options.sortBy) {

      const sortingCriteria = [];
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        sortingCriteria.push((order === 'desc' ? '-' : '') + key);
      });
      sort = sortingCriteria.join(' ');
      // console.log(sort)
    } else {
      sort = 'createdAt';
    }
    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
    const select = options && options.select ? options.select : null
    const skip = (page - 1) * limit;

    const countPromise = this.countDocuments(filter).exec();

    // Remove virtual properties from schema

    let docsPromise;
    // if (options && options.removeVirtuals && options.removeVirtuals.length)
    //   options.removeVirtuals.forEach(rm => { delete this.schema.virtuals[rm] })

    // Get lean and selected fields documents

    if (select && options.lean)
      docsPromise = this.find(filter).select(select).lean().sort(sort).skip(skip).limit(limit);

    else if (select && !options.lean)
      docsPromise = this.find(filter).select(select).sort(sort).skip(skip).limit(limit);

    else docsPromise = this.find(filter).sort(sort).skip(skip).limit(limit);

    if (options.populate) {
      // Handle different types of populate options
      if (typeof options.populate === 'string') {
        // String format: "field1,field2.subfield"
        options.populate.split(',').forEach((populateOption) => {
          docsPromise = docsPromise.populate(
            populateOption
              .split('.')
              .reverse()
              .reduce((a, b) => ({ path: b, populate: a }))
          );
        });
      } else if (Array.isArray(options.populate)) {
        // Array format: [{ path: 'field1' }, { path: 'field2' }]
        options.populate.forEach((populateOption) => {
          docsPromise = docsPromise.populate(populateOption);
        });
      } else {
        // Object format: { path: 'field', select: 'name' }
        docsPromise = docsPromise.populate(options.populate);
      }
    }

    docsPromise = docsPromise.exec();

    return Promise.all([countPromise, docsPromise]).then((values) => {
      const [totalResults, results] = values;
      const totalPages = Math.ceil(totalResults / limit);
      const result = {
        results,
        page,
        limit,
        totalPages,
        totalResults,
      };
      return Promise.resolve(result);
    });
  };
};

module.exports = paginate;

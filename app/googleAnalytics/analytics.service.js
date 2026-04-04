
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { analyticsDataClient } = require('../../config/googleAnalytics');
const config = require('../../config/config');
const { GoogleAuth } = require('google-auth-library');
const key = require('../../config/googleKey.json')
const { google } = require('googleapis');
const { googleSearch } = require('../../config/enums');
const path = require("path")
const configFile = path.resolve(__dirname, '../../config/googleKey.json')
// const googleAnalytics = async (body) => {
//   try {
//     // Batching logic
//     let date={}
//     if(body.to )
//     date["to"]=body.to
//   if(body.from)
//   date["from"]=body.from
//     let {to,from}=dateValidation(date)
//     const batchSize = 10;
//     const metricBatches = [];
//     if(!body&&!body.metrics.length)
// throw new ApiError(httpStatus.BAD_REQUEST," please Add metrics in the body")
//     for (let i = 0; i < body.metrics.length; i += batchSize) {
//       metricBatches.push(body.metrics.slice(i, i + batchSize));
//     }


//     let result = {};

//     // Make separate requests for each metric batch
//     for (const metricBatch of metricBatches) {
//       const [response] = await analyticsDataClient.runReport({
//         property: `properties/${config.GA_property_id}`,
//         dateRanges: [
//           {
//             startDate: from,
//             endDate: to
//           },
//         ],
//         metrics: metricBatch,
//       });

//       console.log('Report result:');

//       if (response && response.rows.length) {
//         response.rows.forEach((row) => {
//           if (row.metricValues.length) {
//             const rowObject = {};
//             row.metricValues.forEach((metric, index) => {
//               let property = metricBatch[index].name;
//               rowObject[property] = metric.value ? metric.value : null;
//             });
//             // result.push(rowObject);
//             Object.assign(result,rowObject)
//           }
//         });
//       }
//     }

//     return result;
//   } catch (err) {
//     throw new ApiError(httpStatus.BAD_REQUEST, err.message);
//   }
// }

// let dateValidation=(dateFilter)=>{
//   if (dateFilter && (dateFilter.to || dateFilter.from)) {
//     const { to, from } = dateFilter
//     if (to && new Date(to).getTime() > new Date().getTime())
//     {

//       let formateddate=dateFormater()
//       dateFilter.to=`${formateddate.year}-${formateddate.month}-${formateddate.day}`;
//     }

//     if (from && new Date(from).getTime() > new Date().getTime())

//     {
//       let formateddate=dateFormater()
//       dateFilter.from=`${formateddate.year}-${formateddate.month}-${formateddate.day}`;
//     }
//     if (to && from && new Date(to).getTime() < new Date(from).getTime())
//      { let formateddate =dateFormater(to)
//       dateFilter.from=`${formateddate.year}-${formateddate.month}-${formateddate.day}`}
//       return dateFilter
// }
// }
// const dateFormater=(date)=>
// {
//   {
//     const today =date?new Date(date):new Date();

//     const year = today.getFullYear();
//     const month = String(today.getMonth() + 1).padStart(2, '0'); 
//     const day = String(today.getDate()).padStart(2, '0');
//     return {year:year,month:month,day:day}
//   }
// }

// module.exports = {
//   googleAnalytics,
// };


// // the bollow code is used to get all matrics names

// // const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const getGoogleAnalytics = async () => {
    try {
      // const analyticsDataClient = new BetaAnalyticsDataClient();

        // Fetch metadata to get the list of available metrics
        const [metadata] = await analyticsDataClient.getMetadata ({
            name: `${GA_PROPERTY_ID}/metadata`,
        });

        const metricNames = metadata.metrics.map(metric => metric.apiName);

        console.log('All Metric Names:', metricNames);

        return metricNames;
 

}
catch (err) {
        console.error('Error:', err.message);
        throw err;
    }
}


// // module.exports = {
// //   googleAnalytics,
// // };



const GA_PROPERTY_ID = `properties/${config.GA_property_id}`;
const credentials = key

let dateValidation = (dateFilter) => {
  if (dateFilter && (dateFilter.to || dateFilter.from)) {
    const { to = null, from = null } = dateFilter
    if (to && new Date(to).getTime() > new Date().getTime()) {

      let formateddate = dateFormater()
      dateFilter.to = `${formateddate.year}-${formateddate.month}-${formateddate.day}`;
    }

    if (from && new Date(from).getTime() > new Date().getTime()) {
      let formateddate = dateFormater()
      dateFilter.from = `${formateddate.year}-${formateddate.month}-${formateddate.day}`;
    }
    if (to && from && new Date(to).getTime() < new Date(from).getTime()) {
      let formateddate = dateFormater(to)
      dateFilter.from = `${formateddate.year}-${formateddate.month}-${formateddate.day}`
    }
    return dateFilter
  }
}
const dateFormater = (date) => {
  {
    const today = date ? new Date(date) : new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return { year: year, month: month, day: day }
  }
}

const googleAnalytics = async (body) => {
  try {
    // Validate body and extract dates
    if (!body || !body.metrics || !body.metrics.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Please add metrics in the body");
    }

    const batchSize = 10;
    const metricBatches = [];
    for (let i = 0; i < body.metrics.length; i += batchSize) {
      metricBatches.push(body.metrics.slice(i, i + batchSize));
    }

    let result = [];
    let date = {};
    if (body.to) date["to"] = body.to;
    if (body.from) date["from"] = body.from;

    let { to, from } = dateValidation(date);

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const authClient = await auth.getClient();
    const analyticsdata = google.analyticsdata({
      version: 'v1beta',
      auth: authClient,
    });

    for (const metrics of metricBatches) {
      const request = {
        property: GA_PROPERTY_ID,
        dateRanges: [
          {
            startDate: from,
            endDate: to,
          },
        ],
        dimensions: body.dimensions,
        metrics: metrics,
      };

      const response = await analyticsdata.properties.runReport({
        property: GA_PROPERTY_ID,
        requestBody: request,
      });

      if (response.data.rows) {
        const formattedData = response.data.rows.map(row => {
          const rowObject = {};
          row.dimensionValues?.forEach((dimension, index) => {
            rowObject[body.dimensions[index].name] = dimension.value;
          });
          row.metricValues.forEach((metric, index) => {
            rowObject[metrics[index].name] = metric.value ? metric.value : null;
          });
          return rowObject;
        });

        // Merge current batch result with the overall result
        if (result.length === 0) {
          result = formattedData;
        } else {
          formattedData.forEach((row, rowIndex) => {
            result[rowIndex] = { ...result[rowIndex], ...row };
          });
        }
      } else {
        console.warn('No rows found in the response for metrics:', metrics);
      }
    }
    result.sort((firstResult, secondResult) => {
      return firstResult.date.localeCompare(secondResult.date);
    });
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getTopKeywords = async (query) => {
  try {
    const auth = new GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const authClient = await auth.getClient();
    const webmasters = google.webmasters({
      version: 'v3',
      auth: authClient,
    });


    requestBody = {
      startDate: query.from,
      endDate: query.to,
      rowLimit: query.limit ? query.limit : googleSearch.KEY_WORDS_LIMIT,
    };


    const queryRequest = {
      siteUrl: query.siteUrl,
      requestBody: {
        ...requestBody,
        dimensions: ['query'],
      },
    };

    const dateRequest = {
      siteUrl: query.siteUrl,
      requestBody: {
        ...requestBody,
        dimensions: ['date'],
      },
    };

    const totalRequest = {
      siteUrl: query.siteUrl,
      requestBody: {
        ...requestBody,
        dimensions: [],
      },
    };
    const [queryResponse, dateResponse, totalResponse] = await Promise.all([
      webmasters.searchanalytics.query(queryRequest),
      webmasters.searchanalytics.query(dateRequest),
      webmasters.searchanalytics.query(totalRequest),
    ]);

    let result = {
      queryData: [],
      dateData: [],
      totalData: [],
    };

    if (queryResponse && queryResponse.data && queryResponse.data.rows && queryResponse.data.rows.length > 0) {
      result.queryData = queryResponse.data.rows;
    }

    if (dateResponse && dateResponse.data && dateResponse.data.rows && dateResponse.data.rows.length > 0) {
      result.dateData = dateResponse.data.rows;
    }

    if (totalResponse && totalResponse.data && totalResponse.data.rows && totalResponse.data.rows.length > 0) {
      result.totalData = totalResponse.data.rows;
    }

    return result;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message)

  }

}

/**
 * Fetches data from Google Analytics based on the given date range and options
 * @param {{to: string, from: string}} date - The date range to fetch data for
 * @param {{metrics: string[], dimensions?: string[], filter?: string}} options - Options for the request
 * @returns {Promise<import("google-auth-library").GoogleAuthClientResponse>} The response from Google Analytics
 * @throws {ApiError} If there is an error with the request
 */
async function fetchGoogleAnalytics(date, options) {
  const { to, from } = date;
  const auth = new google.auth.GoogleAuth({
    keyFile: configFile,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const analyticsdata = google.analyticsdata({
    version: 'v1beta',
    auth: await auth.getClient(),
  });

  const request = {
    property: GA_PROPERTY_ID,
    requestBody: {
      dateRanges: [
        { startDate: from, endDate: to }, // Adjust date range as needed
      ],
      metrics: options.metrics,

    },
  };
  if (options.dimensions)
    request.requestBody["dimensions"] = options.dimensions;
  if (options.filter) {
    request.requestBody["dimensionFilter"] = { filter: options.filter }

    request.requestBody["metrics"] = options.metrics;
  }
  // console.log(JSON.stringify(request));
  try {
    const response = await analyticsdata.properties.runReport(request);
    // console.log(JSON.stringify(response.data))
    return response?.data;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
}
// fetchProductPageViewData();
async function googleEventNames(query) {
  const { to, from, type } = query;
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const authClient = await auth.getClient();
  const analyticsdata = google.analyticsdata({
    version: 'v1beta',
    auth: authClient,
  });

  let request = {

    // property: GA_PROPERTY_ID,
    // requestBody: {
    //   dateRanges: [
    //     { startDate: from, endDate: to }, // Use a broad date range
    //   ],
    //   // dimensions: [{ name: 'eventName' }],
    //   metrics: [{ name: 'eventCount' }], // Optional, to see how often each event occurs
    // },
  };
  if (type == 'metrics')
    request = { name: GA_PROPERTY_ID + "/metadata" }
  else request = {
    property: GA_PROPERTY_ID,
    requestBody: {
      dateRanges: [
        { startDate: from, endDate: to }, // Use a broad date range
      ],
      // dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }], // Optional, to see how often each event occurs
    },
  };
  try {
    // for events
    // const response = await analyticsdata.properties.runReport(request);

    // return response.data.rows.map(row => row.dimensionValues[0].value);
    // for metrics
    const response = await analyticsdata.properties.getMetadata(request);
    const metrics = response.data.metrics;
    const result = [];
    metrics.forEach(metric => {
      result.push(metric.apiName);
    });
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
}

/**
 * @function googleAnalyticsV2
 * @description Get data from Google Analytics given an array of metrics and a date range
 * @param {Object} body - The request body
 * @param {string[]} body.metrics - The metrics to fetch data for
 * @param {string} [body.from] - The start date for the data range
 * @param {string} [body.to] - The end date for the data range
 * @returns {Object} - An object where the keys are the metric names and the values are the values for those metrics
 */
const googleAnalyticsHandler = async (body, type, graph = false) => {
  try {
    // Validate body and extract dates
    // if (!body || !body.metrics || !body.metrics.length) {
    //   throw new ApiError(httpStatus.BAD_REQUEST, "Please add metrics in the body");
    // }

    //  Analytics new implementation
    let date = {};
    if (body.to) date["to"] = body.to;
    if (body.from) date["from"] = body.from;
    date = dateValidation(date);
    let options;
    if (type == "metrics" && body.metrics && body.metrics.length) {
      options = {

        eventType: graph ? 'date' : 'eventName',
        metrics: body.metrics

      }
      if (graph)
        options["dimensions"] = [{ name: 'date' }]
    }
    else if (type == "events" && body.events && body.events.length)
      options = {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: body.events
          },
        },
        metrics: [{ name: 'eventCount' }],
        eventType: graph ? 'date' : 'eventName',
        dimensions: graph ? [{ name: 'date' }, { name: 'eventName' }] : [{ name: 'eventName' }]

      }
    const analytics = await fetchGoogleAnalytics(date, options);
    if (!analytics || !analytics.rows || !analytics.rows.length)
      return [];
    return analytics;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * @function googleAnalyticsV2
 * @description Get data from Google Analytics given an array of metrics and events and a date range
 * @param {Object} body - The request body
 * @param {string[]} body.metrics - The metrics to fetch data for
 * @param {string[]} body.events - The events to fetch data for
 * @param {string} [body.from] - The start date for the data range
 * @param {string} [body.to] - The end date for the data range
 * @returns {Object} - An object where the keys are the metric names and the values are the values for those metrics
 */
const googleAnalyticsV2 = async (body) => {
  let result = {}
  if (body.metrics && body.metrics.length) {
    const metricsCount = {};
    const chunkSize = 10; // Limit metrics to 10 per request due to API constraints
    const metricsChunks = [];
    for (let i = 0; i < body.metrics.length; i += chunkSize) {
      metricsChunks.push(body.metrics.slice(i, i + chunkSize));
    }
    for (const metrics of metricsChunks) {
      body.metrics = metrics;
      const analytics = await googleAnalyticsHandler(body, "metrics");
      analytics?.metricHeaders?.forEach((metricHeader, index) => {
        const metricName = metricHeader.name;
        const metricValue = analytics.rows[0]?.metricValues[index]?.value;
        metricsCount[metricName] = metricValue;
      });
    }

    Object.assign(result, metricsCount);
  }
  if (body.events && body.events.length) {
    const rowObject = {}
    const analytics = await googleAnalyticsHandler(body, "events");
    analytics?.rows?.forEach(row => {
      if (row?.dimensionValues?.length && row?.metricValues?.length) {
        rowObject[row.dimensionValues[0].value] = row.metricValues[0].value;
      }
    })
    Object.assign(result, rowObject);
  }
  return result;
}

/**
 * @function googleDimension
 * @description Retrieves and processes Google Analytics data for given metrics or events,
 *              organizing the data into graph-ready format sorted by date.
 * @param {Object} body - The request body containing metrics or events.
 * @param {string[]} body.metrics - The list of metrics to fetch data for.
 * @param {string[]} body.events - The list of events to fetch data for.
 * @returns {Array<Object>} - Returns an array of objects containing labels and sorted graph data
 *                            for each metric or event, with each graph containing date and count.
 * @throws {ApiError} - Throws an error if the analytics data cannot be fetched.
 */

const googleDimension = async (body) => {
  let result = [];
  if (body.metrics && body.metrics.length) {
    const analytics = await googleAnalyticsHandler(body, "metrics", true);
    const graphData = body.metrics.map(metricName => ({
      label: metricName,
      graph: []
    }));
    // Populate the graph data
    analytics.rows.forEach(row => {
      const date = row.dimensionValues[0].value; // Extract the date dimension value

      row.metricValues.forEach((metricValue, index) => {
        graphData[index].graph.unshift({
          date: formatDate(date),
          count: metricValue.value
        });
      });
    });
    // Sort graph arrays for each metric
    graphData.forEach(metric => {
      metric.graph.sort((a, b) => a.date.localeCompare(b.date));
    });
    result = [...result, ...graphData];
  }
  if (body.events && body.events.length) {
    const analytics = await googleAnalyticsHandler(body, "events", true);
    const eventData = body.events.map(event => ({
      label: event,
      graph: [],
    }));

    // Populate data for specified events
    analytics.rows.forEach(row => {
      const rawDate = row.dimensionValues[0].value;
      const eventName = row.dimensionValues[1].value;
      const eventIndex = body.events.indexOf(eventName);
      if (eventIndex > -1) {
        eventData[eventIndex].graph.push({
          date: formatDate(rawDate),
          count: row.metricValues[0].value,
        });
      }
    });

    // Sort graphs for each event by date
    eventData.forEach(event => {
      event.graph.sort((a, b) => a.date.localeCompare(b.date));
    });

    result = [...result, ...eventData];
  }
  return result;
}

/**
 * Format a given date string from the Google Analytics API (YYYYMMDD)
 * into a more human-readable format (YYYY-MM-DD)
 * @param {string} date - The date string from the Google Analytics API
 * @returns {string} - The formatted date string
 */
const formatDate = (date) => {
  const year = date.substring(0, 4);
  const month = date.substring(4, 6);
  const day = date.substring(6, 8);
  return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
}
module.exports = {
  googleAnalytics,
  getTopKeywords,
  googleEventNames,
  googleAnalyticsV2,
  googleDimension
};
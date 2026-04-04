
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const key = require('./googleKey.json');

const {
  client_email,
  private_key,
  project_id,
} = key;

// Create the analyticsDataClient using extracted credentials
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email,
    private_key,
    project_id,
  },
});

module.exports={
    analyticsDataClient
}
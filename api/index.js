/**
 * Vercel serverless entry: Express app + cached MongoDB connection.
 * Local development should keep using `npm start` (server.js).
 */
require('module-alias/register');

const mongoose = require('mongoose');
const app = require('../config/express');
const config = require('../config/config');

if (process.env.VERCEL) {
  app.set('trust proxy', 1);
}

function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }
  if (!global.__mongoConnectPromise) {
    global.__mongoConnectPromise = mongoose.connect(
      config.mongo.url,
      config.mongo.options
    );
  }
  return global.__mongoConnectPromise;
}

module.exports = async (req, res) => {
  try {
    await connectMongo();
  } catch (err) {
    if (!res.headersSent) {
      return res.status(503).json({
        status: 503,
        message: 'Database connection failed',
      });
    }
    return;
  }
  app(req, res);
};

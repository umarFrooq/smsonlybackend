/**
 * Vercel serverless entry: Express app + cached MongoDB connection.
 *
 * Do not use `async (req, res) => { await db; app(req, res); }` — the returned
 * Promise resolves before Express finishes the response, so Vercel can end the
 * invocation early (FUNCTION_INVOCATION_FAILED / 500).
 *
 * This file exports a small Express app that connects Mongo then `next()`s into
 * the real app so the @vercel/node runtime keeps the invocation alive correctly.
 *
 * Local dev: keep using `npm start` (server.js).
 */
require('module-alias/register');

const express = require('express');
const mongoose = require('mongoose');
const config = require('../config/config');
const mainApp = require('../config/express');

if (process.env.VERCEL) {
  mainApp.set('trust proxy', 1);
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

const serverless = express();

serverless.use((req, res, next) => {
  const method = (req.method || '').toUpperCase();
  if (method === 'OPTIONS') {
    return next();
  }
  connectMongo()
    .then(() => next())
    .catch(() => {
      if (!res.headersSent) {
        res.status(503).json({
          status: 503,
          message: 'Database connection failed',
        });
      }
    });
});

serverless.use(mainApp);

module.exports = serverless;

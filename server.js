// require('appoptics-apm')
require('module-alias/register');

const mongoose = require('mongoose');
const app = require('./config/express');
const config = require('./config/config');
const logger = require('./config/logger');
// require('./config/components/cron');

const mongoUri = config.mongo.url;
const mongoOptions = config.mongo.options;

let server;

// Connect to MongoDB
mongoose.connect(mongoUri, mongoOptions)
  .then(() => {
    logger.info('✅ Connected to MongoDB');

    // Start Express server only after successful DB connection
    server = app.listen(config.port, () => {
      logger.info(`🚀 Listening on port ${config.port} (${config.env})`);
    });
  })
  .catch((err) => {
    logger.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
 

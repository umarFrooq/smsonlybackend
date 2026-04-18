const path = require("path");
const express = require("express");
//Sentry Integration for Error and Performance Monitoring
const Sentry = require('@sentry/node');
const Tracing = require("@sentry/tracing");
const httpStatus = require('http-status');
const morgan = require('./morgan');
const bodyParser = require("body-parser");
const compress = require("compression");
const methodOverride = require("method-override");
const cors = require("cors");
const helmet = require("helmet");
const routes = require("../app/routes");
const config = require("./config");
const passport = require("passport");
const mongoSanitize = require('express-mongo-sanitize');
const { jwtStrategy } = require('./passport');
const { authLimiter } = require('../middlewares/rateLimiter');
//var CronJob = require("cron").CronJob; 
// const loger = require("./../middlewares/logger");
const app = express();
const xss = require('xss-clean');
const ApiError = require('../utils/ApiError');
const { errorConverter, errorHandler } = require('../middlewares/error');
const routerV2 = require("../app/v2.routes");
// const { i18nMidleware, i18n } = require("@/middlewares/i18n");
const i18n = require('i18n')
const swaggerUi = require('swagger-ui-express');
const swaggerDef = require("../swagger/swagger.def");
const basicAuth = require('express-basic-auth');

// const messaging = require("@/firebase/firebase.utils");

// Sentry Initialization
Sentry.init({
  dsn:
    'https://60f829a3f77149469346c47d5ff3f052@o572765.ingest.sentry.io/5722525',
  release: process.env.npm_package_version,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app })
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1
})

Sentry.setTag('environment', config.env)

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler())
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler())


if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Choose what fronted framework to serve the dist from
const distDir = "../public";
app.use(express.static(path.join(__dirname, distDir)));
app.use(/^((?!(v1)|(v2)).)*/, (req, res) => {
  res.sendFile(path.join(__dirname, distDir + "/index.html"));
});
// console.log(messaging);
// parse json request body
app.use(express.json({ limit: '10mb' }));

// parse urlencoded request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// sanitize request data
app.use(xss());
// app.use(mongoSanitize());

//  var job = new Cronjob(     "0 0 */2 * * *",    
//   function () { 
//              apiFunction()  
//                },     null,     true,     "America/Los_Angeles" );
//                  job.start()
// // gzip compression
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable cors
app.use(cors({
  origin: '*'
}));
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// Subscription check middleware (enforces active billing)
const subscriptionCheck = require('../app/middlewares/subscriptionCheck');
// Apply after auth initialization; the middleware itself inspects req.user when present.
app.use((req, res, next) => {
  // Skip subscription check for public v1 paths (middleware will also re-check), but attach to all v1 routes below
  next();
});

// multilingual
i18n.configure({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  directory: path.join(__dirname, 'locales'),
  objectNotation: true,
  updateFiles: false
})
const i18nMidleware = (req, res, next) => {
  // i18n.setLocale(res, req.query.lang ||"en");
  i18n.setLocale(res, req.headers['lang'] || "en");
  next()
}
app.use(i18n.init);
app.use(i18nMidleware);


// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
  app.use("/v2/auth", authLimiter)
}
//  app.use(loger);

app.response.sendStatus = function (data, status = 200, message = 'OK', type = 'application/json') {
  // loger(this.req, this, message);
  const resp = { data: data ? data : null, status, message }
  // code is intentionally kept simple for demonstration purpose
  return this.contentType(type)
    .status(status)
    .send(resp)
}

// api v1 router
// app.get('/v1/sitemap.xml', async (req, res) => {
//   try {
//     const result = await siteMapParsing();
//     res.status(200).send(result);
//     // Code to try
//   } catch (err) {
//     // Catch errors
//     console.log(e);
//     res.status(400).send(err);

//   }
// });
app.get("/v1/callback", async (req, res) => {
  console.log(res)
})
// Mount subscription check BEFORE routes so it runs on incoming /v1 requests
app.use('/v1/', subscriptionCheck);
app.use("/v1/", routes);
// Also protect v2 routes with the same subscription check middleware
app.use('/v2/', subscriptionCheck);
app.use("/v2/", routerV2)


var swaggerHtmlV2 = swaggerUi.generateHTML(swaggerDef.swaggerDef, swaggerDef.options)
app.use('/v1/doc', swaggerUi.serveFiles(swaggerDef.swaggerDef, swaggerDef.options))
app.get('/v1/doc', basicAuth({
  users: { 'docsUser': 'SLx3Izh7gTa2zF91me9D' },
  challenge: true,
}), (req, res) => {

  res.send(swaggerHtmlV2)

});

// catch 404 and forward to error handler

// The Sentry error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture all 404 and 500 errors
    if (error.status > 399) {
      return true;
    }
    return false;
  },
}));

// send back a 404 error for any unknown v1 request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'NOT_FOUND'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);
// app.response.sendStatus = function (data, status = 200, message = 'OK', type = 'application/json') {
//   const resp = { data: data ? data : null, status, message }
//   return this.contentType(type)
//     .status(status)
//     .send(resp)
// }
module.exports = app;

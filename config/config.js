const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');
dotenv.config({ path: path.join(__dirname, '../.env') });

const envVarsSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
        PORT: Joi.number().default(3000),
        MONGODB_URL: Joi.string().required().description('Mongo DB url'),
        JWT_SECRET: Joi.string().required().description('JWT secret key'),
        JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(330).description('minutes after which access tokens expire'),
        JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
        JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which reset password tokens expire'),
        JWT_REGISTER_OR_LOGIN_FROM_EMAIL_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which registerOrLogin tokens expire'),
        JWT_VERIFICATION_EMAIL_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which verification email tokens expire'),
        JWT_VERIFICATION_PHONE_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which verification email tokens expire'),
        JWT_OTP_MIN: Joi.number().default(330).description('minutes after which phone and email verification access tokens expire'),
        SMTP_HOST: Joi.string().description('server that will send the emails'),
        SMTP_PORT: Joi.number().description('port to connect to the email server'),
        SMTP_USERNAME: Joi.string().description('username for email server'),
        SMTP_PASSWORD: Joi.string().description('password for email server'),
        EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
        AWS_ACCESS_KEY_ID: Joi.string().description('the AWS access ID'),
        AWS_SECRET_ACCESS_KEY: Joi.string().description('the AWS access key'),
        AWS_REGION: Joi.string().description('the AWS access key'),
        AWS_BUCKET_NAME: Joi.string().description('the AWS bucket name'),
        ALGOLIA_APPLICATION_ID: Joi.string().description('Algolia Application ID'),
        ROUTEE_SECRET_KEY: Joi.string().description("Routee secret key"),
        ROUTEE_APPLICATION_ID: Joi.string().description("Routee application Id"),
        FACEBOOK_CLIENT_ID: Joi.string().description("Facebook client Id"),
        FACEBOOK_CLIENT_SECRET_KEY: Joi.string().description("Facebook client secret Id"),
        GOOGLE_CLIENT_ID: Joi.string().description("Google client Id"),
        GOOGLE_CLIENT_SECRET_KEY: Joi.string().description("Google client secret key"),
        GOOGLE_CALLBACK_URL: Joi.string().description("Google callback"),
        FACEBOOK_CALLBACK_URL: Joi.string().description("Facebook callback"),
        REDIS_PORT: Joi.number().required().description('REDIS PORT'),
        REDIS_HOST: Joi.string().required().description('REDIS HOST'),
        REDIS_PASSWORD: Joi.string().required().description('REDIS PASSWORD'),
        ROUTEE_SENDER: Joi.string().required().description('Sender of sms'),
        FIRE_BASE_SELLER_APP: Joi.string().description('push notification on seller app'),
        FIRE_BASE_CUSTOMER_APP: Joi.string().description('push notification on customer app'),
        SCHEDULE_TIME_TCS_SYNC: Joi.string().description('Schedule time for TCS sync'),
        SCHEDULE_TIME: Joi.string().required().description("Schedule Time Error"),
        CUSTOM_REF_CODES: Joi.string().required().description("Rani Baji Ref Codes"),
        ALFA_MERCHANT_ID: Joi.string().required().description("Alfa Merchant Id"),
        ALFA_STOREID: Joi.string().required().description("Alfa Store Id"),
        ALFA_URL: Joi.string().required().description("Alfa Url"),
        MASTER_PASSWORD: Joi.string().required().description("Master password to login"),
        DOMAIN_NAME: Joi.string().description("Domain name."),
        CRONE_AUTH: Joi.string().required().description("authentication token for cronejobs"),
        STREAMING_SERVICE: Joi.string().required().description("streaming service url"),
        TCS_LABEL_URL: Joi.string().required().description("url for tcs label printing"),
        // WP credentials for api

        WP_ENDPOINT: Joi.string().required().description("Wordpress endpoint"),
        // WP_USER: Joi.string().required().description("Wordpress user"),
        // WP_PASSWORD: Joi.string().required().description("Wordpress password"),
        CONSUMER_KEY: Joi.string().required().description("Consumer key"),
        CONSUMER_SECRET: Joi.string().required().description("Consumer secret"),
        ADMIN_DOMAIN_URL: Joi.string().description("bazaarghar admin url").default("https://admin-stage.bazaarghar.com/").required(),
        LAMBDA_API_KEY: Joi.string().description("Aws lambda function required key in headers").required(),
        B247_BASE_URL: Joi.string().description("bazaarghar b247 service domain url").required(),
        GA_PROPERTY_ID: Joi.string().description("google analytics property id").required(),
        TYPESENSE_HOST: Joi.string().description("typesense host").required(),
        TYPESENSE_PORT: Joi.number().required(),
        TYPESENSE_API_KEY: Joi.string().required(),
        TYPESENSE_PROTOCOL: Joi.string().required(),
        TYPESENSE_QS_COLLECTION: Joi.string().required(),
        TYPESENSE_COLLECTION: Joi.string().required(),
        PLATFROM_REGION: Joi.string().description("platform region"),
        // Ali express api credentials
        AE_APP_KEY: Joi.string().description("ali express api key").required(),
        AE_APP_SECRET: Joi.string().description("ali express seceret key").required(),
        LOGS_COLLECTOR: Joi.string().required().description("Logs Sumo Logic collector"),

        OPENAI_KEY: Joi.string().description("open ai secret key").required(),
        OPENAI_URL: Joi.string().description("open ai  embeding url").required(),
        APILAYR_URL: Joi.string().description("APLayer url for currency conversion").required(),
        APILAYR_KEY: Joi.string().description("APLayer key for currency conversion").required(),
        // SHOPIFY_CLIENT_ID: Joi.string().description("Shopify client id").required(),
        // SHOPIFY_CLIENT_SECRET: Joi.string().description("Shopify client secret").required(),
        API_KEY_ENC_KEY: Joi.string().description("Api key encryption key").required(),
        API_KEY_ENC_KEY_IV: Joi.string().description("Api key encryption key iv").required(),
        GINKGO_USER: Joi.string().description("Ginkgo user name").required(),
        GINKGO_PASSWORD: Joi.string().description("Ginkgo password").required(),
        GINKGO_BASE_URL: Joi.string().description("Ginkgo base url").required(),

        CHECKOUT_SECRET_KEY: Joi.string().description("checkout secret key is required").required(),
        PROCESSING_CHENNEL_ID: Joi.string().description("checkout processing channel id is required").required(),
        CHECKOUT_BASE_URL: Joi.string().description("checkout base url is required").required(),
    })
    .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    env: envVars.NODE_ENV,
    region: envVars.PLATFROM_REGION,
    port: envVars.PORT,
    domainName: envVars.DOMAIN_NAME,
    adminDomain: envVars.ADMIN_DOMAIN_URL,
    masterPassword: envVars.MASTER_PASSWORD,
    domainName: envVars.DOMAIN_NAME,
    awsLambdaKey: envVars.LAMBDA_API_KEY,
    mongo: {
        url: envVars.NODE_ENV === 'test' ? envVars.MONGODB_URL_TEST : envVars.MONGODB_URL,
        options: {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        },
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
        refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
        resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
        registerOrLoginFromEmailTokenExpirationMinutes: envVars.JWT_REGISTER_OR_LOGIN_FROM_EMAIL_EXPIRATION_MINUTES,
        verificationEmailExpirationMinutes: envVars.JWT_VERIFICATION_EMAIL_EXPIRATION_MINUTES,
        verificationPhoneExpirationMinutes: envVars.JWT_VERIFICATION_PHONE_EXPIRATION_MINUTES,
        EmailPhoneVerifExpireationMinutes: envVars.JWT_OTP_MIN,
    },
    aws: {
        awsAccessKeyId: envVars.AWS_ACCESS_KEY_ID,
        awsSecretAccesskey: envVars.AWS_SECRET_ACCESS_KEY,
        awsRegion: envVars.AWS_REGION,
        //awsBucketName: envVars.AWS_BUCKET_NAME,
        awsBucketName: envVars.AWS_BUCKET_NAME + (envVars.NODE_ENV === 'test' ? '-test' : ''),
        awsCdnHost: envVars.AWS_CDN_HOST
    },
    algolia: {
        algoliaApplicationId: envVars.ALGOLIA_APPLICATION_ID,
        algoliaWriteApiKey: envVars.ALGOLIA_WRITE_API_KEY,

    },
    email: {
        smtp: {
            host: envVars.SMTP_HOST,
            port: envVars.SMTP_PORT,
            auth: {
                user: envVars.SMTP_USERNAME,
                pass: envVars.SMTP_PASSWORD,
            },
        },
        from: envVars.EMAIL_FROM,
    },
    routee: {
        secretKey: envVars.ROUTEE_SECRET_KEY,
        applicationId: envVars.ROUTEE_APPLICATION_ID,
        sender: envVars.ROUTEE_SENDER
    },
    facebook: {
        clientId: envVars.FACEBOOK_CLIENT_ID,
        secretId: envVars.FACEBOOK_CLIENT_SECRET_KEY,
        CALLBACK: envVars.FACEBOOK_CALLBACK_URL
    },
    google: {
        clientId: envVars.GOOGLE_CLIENT_ID,
        secretId: envVars.GOOGLE_CLIENT_SECRET_KEY,
        CALLBACK: envVars.GOOGLE_CALLBACK_URL
    },
    redis: {
        options: {
            port: envVars.REDIS_PORT,
            host: envVars.REDIS_HOST,
            password: envVars.REDIS_PASSWORD
        }
    },
    pkPayment: {
        currency: "PKR",
        shippingCharges: 150
    },
    ksaPayment: {
        currency: "SAR",
        shippingCharges: 30
    },
    payment: (envVars.PLATFROM_REGION && envVars.PLATFROM_REGION === 'ksa') ? { currency: "SAR", shippingCharges: 30 } : { currency: "PKR", shippingCharges: 150 },
    firebase: {
        sellerApp: envVars.FIRE_BASE_SELLER_APP,
        customerApp: envVars.FIRE_BASE_CUSTOMER_APP,
    },
    cronJob: {
        SCHEDULE_TIME: envVars.SCHEDULE_TIME
    },
    tcs: {
        userName: envVars.TCS_USERNAME,
        password: envVars.TCS_PASSWORD,
        clientId: envVars.TCS_CLIENTID,
        accountNo: envVars.TCS_ACCOUNT_NO,
        scheduleTime: envVars.SCHEDULE_TIME_TCS_SYNC,
        tcsLabel: envVars.TCS_LABEL_URL
    },
    customRefCodes: envVars.CUSTOM_REF_CODES,
    alfa: {
        merchantId: envVars.ALFA_MERCHANT_ID,
        storeId: envVars.ALFA_STOREID,
        url: envVars.ALFA_URL
    },
    leopards: {
        apiKey: envVars.LEOPARD_API_KEY,
        apiPassword: envVars.LEOPARD_API_PASSWORD,
    },
    auth: {
        croneAuth: envVars.CRONE_AUTH
    },
    wps: {
        url: envVars.WP_ENDPOINT,
        userName: envVars.WP_USER,
        password: envVars.WP_PASSWORD,
        consumerKey: envVars.CONSUMER_KEY,
        consumerSecret: envVars.CONSUMER_SECRET,
    },
    aliExpress: {
        apiKey: envVars.AE_APP_KEY,
        secretKey: envVars.AE_APP_SECRET,
    },
    streamingUrl: envVars.STREAMING_SERVICE,
    b247Url: envVars.B247_BASE_URL,
    phone: envVars.PHONE,
    bazaarghar_Url: envVars.BAZAARGHAR_URL,
    GA_property_id: envVars.GA_PROPERTY_ID,
    checkout: {
        secretKey: envVars.CHECKOUT_SECRET_KEY,
        processingChennelId: envVars.PROCESSING_CHENNEL_ID,
        checkoutBaseUrl: envVars.CHECKOUT_BASE_URL
    },
    typesense: {
        host: envVars.TYPESENSE_HOST,
        port: envVars.TYPESENSE_PORT,
        apiKey: envVars.TYPESENSE_API_KEY,
        protocol: envVars.TYPESENSE_PROTOCOL,
        typesenseQsCollection: envVars.TYPESENSE_QS_COLLECTION,
        typesenseCollection: envVars.TYPESENSE_COLLECTION,

    },
    logsCollector: envVars.LOGS_COLLECTOR,

    openai: {
        openaiKey: envVars.OPENAI_KEY,
        openaiUrl: envVars.OPENAI_URL
    },

    apilayerUrl: envVars.APILAYR_URL,
    apilayerKey: envVars.APILAYR_KEY,
    ginkgo: {
        user: envVars.GINKGO_USER,
        password: envVars.GINKGO_PASSWORD,
        baseUrl: envVars.GINKGO_BASE_URL
    },
    shyp: {
        acno: envVars.SHYP_ACCOUNT_NO,
        username: envVars.SHYP_USER_NAME,
        password: envVars.SHYP_PASSWORD
    },
    address: {
        local: (envVars.PLATFROM_REGION && envVars.PLATFROM_REGION == 'ksa') ? 'SA' : 'PK'
    },
    // shopify: {
    //     cliendId: envVars.SHOPIFY_CLIENT_ID,
    //     secretKey: envVars.SHOPIFY_CLIENT_SECRET
    // },
    encryptionKeys: {
        apiKeyEncKey: envVars.API_KEY_ENC_KEY,
        apiKeyEncKeyIV: envVars.API_KEY_ENC_KEY_IV,
    }
};

const https = require('https');
const fs = require('fs');
const path = require('path');

const express = require('express');
const multer = require('multer');
const formProcessor = multer();
const {
    OpenApiValidator
} = require("express-openapi-validate");
const jsYaml = require("js-yaml");
const jwtExpress = require('express-jwt');
const jwt = require('jsonwebtoken');
const phraseWell = require('know-your-http-well').statusCodesToPhrases;
const cors = require('cors');

// Require global logger
const Logger = require('./logger');

// Read OpenAPI specification and create request validator
const openApiDocument = jsYaml.safeLoad(fs.readFileSync(path.join(__dirname, 'api.yaml'), "utf-8"));
const validator = new OpenApiValidator(openApiDocument);

// This secret is used to create the JWT
const SECRET = "vU$Y/+[D;:<XraqlZ/q`lIe~`;\"u2=^H_GEk,@xGY:K4(CMF,'|TSFZAAFM-As)";

// This handles sending out error messages to the client
// when there is an async error
const asyncHandler = fn =>
    function asyncUtilWrap(req, res, next) {
        const fnReturn = fn.apply(this, arguments);
        return Promise.resolve(fnReturn).catch(next);
    };

// If an error is caught while processing a request we will notify the user
function errorHandler(err, req, res, next) {
    const status = err.status || 500;

    // 500 (Internal Server Error) represents an error that shouldn't happen
    if (status === 500) {
        Logger.error(err.message);
    }
    Logger.trace(err);
    res.status(status).send({
        error: err.toString()
    });
    next();
}

// Generate a secret that is unique to each user (almost)
async function generateSecret(req) {
    const clientIp = req.headers['X-Forwarded-For'] || req.connection.remoteAddress;
    return clientIp + SECRET;
}

// Setup API Router ------------------------------------------------------------

module.exports = function initWeb(database) {

    // Create express app and create api path handler
    let app = express();

    // Middleware to log all requests to the Logger
    app.use(function initialHandler(req, res, next) {

        // Allow requests from any domain
        // TODO: This shouldn't be * (unsecure)
        // res.header("Access-Control-Allow-Origin", "*");
        //
        // // Need this to use swagger examples
        // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Authorization, X-Forwarded-For, Content-Type, Accept");

        // Some trace logging for every incomming request
        Logger.trace("<- |", req.method, req.url, req.path);

        next();
    });

    // Browsers require cors to be enabled when making cross domain requests
    app.use(cors());

    // Serve static files
    app.use('/static', express.static(process.env.TE_STATIC_DIRECTORY || '/srv/tuffyestates/production', {fallthrough: false}));

    // All /api/* calls should be handled by this api router
    const api = express.Router();
    app.use('/api', api);

    // Serve the api specification file on /api
    api.get('/', (req, res) => res.sendFile(path.join(__dirname, 'api.yaml')));

    // Use a JWT middleware to validate a json web token containing authentication info
    api.use((...args) => {
        const req = args[0];
        const next = args[args.length - 1];
        try {

            // Only apply security to pages the explicately request it in the API spec
            for (const security of openApiDocument.paths[req.path][req.method.toLowerCase()].security) {

                // Handle JWT Bearer authentication
                if (security.BearerAuth) {
                    return generateSecret(req).then(secret => {
                        return jwtExpress({
                            secret
                        }).apply(this, args);
                    });
                }
            }
            next();
        } catch (e) {
            next();
        }
    });

    // Convert multipart/form-data into json and accept no files
    api.use(formProcessor.none());

    // Try to parse incoming requests to json if they are ['Content-Type': 'application/json']
    api.use(express.json());

    // Validate request with OpenAPI specification
    api.use((...args) => validator.validate(args[0].method.toLowerCase(), args[0].path).apply(this, args));

    // - asyncHandler allows us to use an async function to handle requests
    // Handle user registration
    api.post('/users', asyncHandler(async function register(req, res, next) {

        // Create a database User from the data provided
        let user = new database.models.User(req.body);

        // Save the user to the database
        await user.save();

        Logger.debug(`User registered:`, req.body.username);

        res.status(201).send();

        next();
    }));

    api.post('/users/login', asyncHandler(async function login(req, res, next) {
        var token = jwt.sign({
            sub: 'mongodb-user-objectid',
            permissions: ['user']
        }, await generateSecret(req));

        res.json({
            token
        });

        next();
    }));

    api.head('/users/logout', asyncHandler(async function logout(req, res, next) {
        res.send();

        next();
    }));

    // Handle sending errors to clients
    api.use(errorHandler);

    // Middleware to log all responses to the Logger
    app.use(function finalHandler(req, res, next) {

        // Some trace logging for every incomming request
        const statusCode = res.statusCode;
        Logger.trace("-> |", statusCode, phraseWell[statusCode]);

        next();
    });


    if (process.env.TE_SSL_CERT_PATH && process.env.TE_SSL_KEY_PATH) {
        Logger.info("Using SSL!");
        app = https.createServer({
            cert: fs.readFileSync(process.env.TE_SSL_CERT_PATH),
            key: fs.readFileSync(process.env.TE_SSL_KEY_PATH)
        }, app);
    }

    return app;
};

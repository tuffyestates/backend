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

// Require global logger
const Logger = require('./logger');

// Read OpenAPI specification and create request validator
const openApiDocument = jsYaml.safeLoad(fs.readFileSync(path.join(__dirname, 'api.yaml'), "utf-8"));
const validator = new OpenApiValidator(openApiDocument);

// This handles sending out error messages to the client
// when there is an async error
const asyncHandler = fn =>
    function asyncUtilWrap(req, res, next) {
        const fnReturn = fn.apply(this, arguments);
        return Promise.resolve(fnReturn).catch(next);
    };

// If an error is caught while processing a request we will notify the user
function errorHandler(err, req, res, next) {
    const status = err.statusCode || 500;

    // 500 (Internal Server Error) represents an error that shouldn't happen
    if (status === 500) {
        Logger.error(err);
    }
    res.status(status).send({
        error: err.toString()
    });
    next();
}

// Setup API Router ------------------------------------------------------------

module.exports = function initWeb(database) {

    // Create express app and create api path handler
    let app = express();

    // Middleware to log all requests to the Logger
    app.use(function initialHandler(req, res, next) {

        // Allow requests from any domain
        // TODO: This shouldn't be * (unsecure)
        res.header("Access-Control-Allow-Origin", "*");

        // Need this to use swagger examples
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

        // Some trace logging for every incomming request
        Logger.trace("Incomming request:", req.method, req.url, req.path);
        next();
    });


    // All /api/* calls should be handled by this api router
    const api = express.Router();
    app.use('/api', api);


    // Serve the api specification file on /api
    api.get('/', (req, res) => res.sendFile(path.join(__dirname, 'api.yaml')));

    api.use(formProcessor.none());

    // Try to parse incoming requests to json if they are ['Content-Type': 'application/json']
    api.use(express.json());

    api.use((...args) => validator.validate(args[0].method.toLowerCase(), args[0].path).apply(this, args));

    // api.all('/api/*', requireAuthentication);



    // - asyncHandler allows us to use an async function to handle requests
    // Handle user registration
    api.post('/users', asyncHandler(async function register(req, res) {

        // Create a database User from the data provided
        let user = new database.models.User(req.body);

        // Save the user to the database
        await user.save();

        Logger.debug(`User registered:`, req.body.username);

        res.status(201).send();
    }));

    // Handle sending errors to clients
    api.use(errorHandler);


    if (process.env.TE_SSL_CERT_PATH && process.env.TE_SSL_KEY_PATH) {
        Logger.info("Using SSL!");
        app = https.createServer({
            cert: fs.readFileSync(process.env.TE_SSL_CERT_PATH),
            key: fs.readFileSync(process.env.TE_SSL_KEY_PATH)
        }, app);
    }

    return app;
};

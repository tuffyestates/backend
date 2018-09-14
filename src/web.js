const express = require('express');
const ajv = new require('ajv')();
const multer = require('multer');
const formProcessor = multer();

// Require global logger
const Logger = require('./logger');

// This handles sending out error messages to the client
// when there is an async error
const asyncHandler = fn =>
    function asyncUtilWrap(req, res, next) {
        const fnReturn = fn.apply(this, arguments);
        return Promise.resolve(fnReturn).catch(next);
    };

// If an error is caught while processing a request we will
// send a 500 (Internal Error) status code and error message
// ** This should only handle unexpected errors **
function errorHandler(err, req, res, next) {
    Logger.error(err);
    res.status(500).send({
        error: err.toString()
    });
    next();
}

// Validate Json schemas before they are passed to the
// actual processing function.
// If data is invalid send a 400 (Bad Request) response
// with the validation error.
function parametersValidator(schema) {
    const validate = ajv.compile(schema);
    return function inputValidator(req, res, next) {
        if (!validate(req.body)) {
            const error = validate.errors[0];
            Logger.debug(`Invalid request parameters: ${error.schemaPath}: ${error.message}`);
            res.status(400).send({
                error: `${error.dataPath || error.params.additionalProperty}: ${error.message}`
            });
        } else next();
    }
}

// Setup API Router ------------------------------------------------------------

module.exports = function initWeb(database) {

    // Create express app and create api path handler
    const app = express();

    // Middleware to log all requests to the Logger
    app.use(function initialHandler(req, res, next) {
        // Allow requests from any domain
        res.header("Access-Control-Allow-Origin", "*");

        // Some trace logging for every incomming request
        Logger.trace("Incomming request:", req.method, req.url, req.path);
        next();
    });


    // All /api/* calls should be handled by this api router
    const api = express.Router();
    app.use('/api', api);

    // Try to parse incoming requests to json if they are ['Content-Type': 'application/json']
    api.use(express.json());

    // api.all('/api/*', requireAuthentication);


    // - formProcessor turns formdata into json (the .none() says not to accept any file attachments)
    //      - See https://github.com/expressjs/multer
    // - parametersValidator is a Json validator for the fields sent in the formdata
    //      - See https://github.com/epoberezkin/ajv#getting-started
    // - asyncHandler allows us to use an async function to handle requests
    // Handle user registration
    api.post('/register', formProcessor.none(), parametersValidator({
        "properties": {
            "username": {
                "type": "string",
                "minLength": 3
            },
            "password": {
                "type": "string",
                "minLength": 3
            }
        },
        "required": ["username", "password"],
        "additionalProperties": false
    }), asyncHandler(async function register(req, res, next) {

        // Create a database User from the data provided
        let user = new database.models.User(req.body);

        // Save the user to the database
        await user.save();

        Logger.debug(`User registered:`, req.body.username);

        res.send({});
    }));

    // Handle sending errors to clients
    api.use(errorHandler);

    return app;
};

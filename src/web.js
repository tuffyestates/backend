const express = require('express');

// Require global logger
const Logger = require('./logger');

// This handles sending out error messages to the client
const asyncHandler = fn =>
    function asyncUtilWrap(...args) {
        const fnReturn = fn(...args);
        const next = args[args.length - 1];
        return Promise.resolve(fnReturn).catch(e => {
            next(JSON.stringify({success: false, error: e.toString()}));
        });
    };

// Setup API Router ------------------------------------------------------------

// Create express app and create api path handler
const app = express(),
    api = express.Router();

// All /api/* calls should be handled by the api router
app.use('/api', api);

// Log all api requests to the Logger
api.use(function log(req, res, next) {
    Logger.trace(req.method, req.url, req.path);
    next();
});

// api.all('/api/*', requireAuthentication);
// Handle user registration
api.get('/register', asyncHandler(async (req, res, next) => {
    const json = JSON.parse(req.body);
    Logger.debug(json);
    res.send({
        success: false
    });
}));

module.exports = app;

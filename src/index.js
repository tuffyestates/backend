// Initial setup
process.title = `tuffy_estates_backend`;
const PORT = process.env.TE_PORT || 11638;

// -----------------------------------------------------------------------------

const express = require('express');

// Require global logger
const Logger = require('./logger');

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
api.get('/register', (req, res) => {
    Logger.debug(req.body);
    res.send({success: false});
});

app.listen(PORT);

Logger.info('Server started!');

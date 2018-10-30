import https from 'https';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

import express from "express";
import multer from "multer";
const formProcessor = multer();
import {
    OpenApiValidator
} from "express-openapi-validate";
import jsYaml from "js-yaml";
import jwtExpress from "express-jwt";
import {
    statusCodesToPhrases
} from "know-your-http-well";
import cors from "cors";
import get from "lodash.get";

// Require global logger
import Logger from "./logger";
import controllers from "./controllers";
import {
    generateSecret
} from "./utils";

// Read OpenAPI specification and create request validator
const openApiDocument = jsYaml.safeLoad(
    fs.readFileSync(path.join(__dirname, "api.yaml"), "utf-8")
);
const validator = new OpenApiValidator(openApiDocument, {ajvOptions: { coerceTypes: true }});

// This handles sending out error messages to the client
// when there is an async error
const asyncHandler = fn =>
    function asyncUtilWrap(req, res, next) {
        const fnReturn = fn.apply(this, arguments);
        return Promise.resolve(fnReturn).catch(next);
    };

// If an error is caught while processing a request we will notify the user
function errorHandler(err, req, res, next) {
    const status = err.status || err.name === "ValidationError" ? 400 : 500;

    // 500 (Internal Server Error) represents an error that shouldn't happen
    if (status === 500) {
        Logger.error(err.message);
    }
    Logger.trace(err);
    res.status(status);
    res.body = {
        error: err.toString()
    };
    next();
}

// Setup API Router ------------------------------------------------------------

let appSingleton = null;

export default function initWeb() {
    if (appSingleton) {
        return appSingleton;
    }

    // Create express app and create api path handler
    let app = express();

    // Middleware to log all requests to the Logger
    app.use(function initialHandler(req, res, next) {
        // Some trace logging for every incomming request
        Logger.trace("<- |", req.method, req.url, req.path);

        next();
    });

    // Browsers require cors to be enabled when making cross domain requests
    app.use(cors());

    // Serve static files
    app.use(
        "/static",
        express.static(
            process.env.TE_STATIC_DIRECTORY || "/srv/tuffyestates/production", {
                fallthrough: false
            }));

    // All /api/* calls should be handled by this api router
    const api = express.Router();
    app.use('/api', api);


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

    // Post process any objects formProcessor might have missed
    api.use((req, res, next) => {
        for (const idx in req.body) {
            const field = req.body[idx];
            if (field.startsWith('{') || field.startsWith('[')) {
                try {
                    req.body[idx] = JSON.parse(field)
                } catch (e) {
                    Logger.trace("Unable to parse possible field:", field);
                }
            }
        }
        next();
    });

    // Process API specification to add paths and their methods
    for (const [path, methods] of Object.entries(openApiDocument.paths)) {
        // path examples: '/', '/users', '/users/login'

        for (const method of Object.keys(methods)) {
            // method examples: 'get', 'post', 'head'

            // Replace '/' with '.', add method, remove all leading '.s
            const controllerPath = (path.replace(/\/\{.+?\}/g, '').replace(/\//g, '.') + `.${method}`).replace(/^\.+/, '');
            // Convert {parameter} to :parameter
            const expressPath = path.replace(/\{(.*?)\}/g, ':$1');

            // Load controller
            const controller = get(controllers, controllerPath);
            assert(controller, `Did not receive valid controller for ${controllerPath}`);

            // Apply method to api
            api[method](expressPath, validator.validate(method, path), asyncHandler(controller));
            Logger.debug(`Registered method: ${method.toUpperCase()}    ${expressPath}    ${path}`);
        }
    }

    // Handle sending errors to clients
    api.use(errorHandler);

    // API path not found (returns an error in JSON rather than the usual 404 page)
    api.use(function api404(req, res, next) {
        if (!res.body) {
            res.status(404);
            res.body = {error: "path not found"};
        }
        next();
    });

    // Middleware to log all responses to the Logger
    app.use(function finalHandler(req, res, next) {
        if (res.body) {
            // If the body is json, send json and convert body to stringified json
            if (typeof res.body === "object") {
                res.type("application/json");
                res.body = JSON.stringify(res.body);
            }

            // Send body
            if (typeof res.body !== "boolean") res.send(res.body);
            else res.send();
        } else {
            res.status(404);
        }

        const statusCode = res.statusCode;

        // Some trace logging for every incomming request
        Logger.trace("-> |", statusCode, statusCodesToPhrases[statusCode]);

        next();
    });

    if (process.env.TE_SSL_CERT_PATH && process.env.TE_SSL_KEY_PATH) {
        Logger.info("Using SSL!");
        app = https.createServer({
                cert: fs.readFileSync(process.env.TE_SSL_CERT_PATH),
                key: fs.readFileSync(process.env.TE_SSL_KEY_PATH)
            },
            app
        );
    }

    appSingleton = app;
    return app;
}

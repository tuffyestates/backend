import assert from "assert";
import fs from "fs";

import {Server, Middleware} from "ayyo";
import mongoose from "mongoose";
const Joi = require("joi");
const Joig = require("joigoose")(mongoose);

import Logger from "./logger";
import API from "./api";
import DB from "./database";
import {get, set} from "./utils";

const CORS_OPTIONS = {
    origin: true,
    credentials: true
};

if (!fs.existsSync(process.env.TE_SSL_KEY_PATH) && !fs.existsSync(process.env.TE_SSL_CERT_PATH)) {
    Logger.warn(`No key/cert pair found at [${process.env.TE_SSL_KEY_PATH}, ${process.env.TE_SSL_CERT_PATH}}]`);
    Logger.warn("Attempting to generate key/cert pair!");

    const selfsigned = require('selfsigned');
    const attrs = [{ name: 'commonName', value: 'estates.localhost' }];
    const pems = selfsigned.generate(attrs, { days: 365, algorithm: 'sha256', keySize: 2048 });
    fs.writeFileSync(process.env.TE_SSL_KEY_PATH, pems.private);
    fs.writeFileSync(process.env.TE_SSL_CERT_PATH, pems.cert);

    Logger.info("Key/cert pair generated successfully.");
}
assert(process.env.TE_SSL_CERT_PATH, 'No SSL cert path env variable');
assert(process.env.TE_SSL_KEY_PATH, 'No SSL key path env variable');

const server = new Server({
    certPath: process.env.TE_SSL_CERT_PATH,
    privKeyPath: process.env.TE_SSL_KEY_PATH
});
server.onError = async function onError({res, error}) {
    res.body = {error: error.message};
    Logger.trace(error);
    Logger.warn(error.data ? error.data.message : error.message);
};

const router = new Middleware.Router();
const api = new Middleware.Router({path: "/api"});
const jwt = new Middleware.JsonWebToken({secret: process.env.TE_SECRET});

async function addRoute(openapi, db, config, pathSegments = []) {
    assert(typeof config !== "undefined");

    // Check if this is a route config
    if (typeof config.handler === "function") {
        config.method = pathSegments.pop();
        config.path = "/" + pathSegments.join("/");

        // Set JWT security middleware
        if (get(config, "openapi.security")) {
            config.chain = [jwt];
            set(config, "openapi.schema.produces.401", {
                body: Joi.object({
                    error: Joi.string().required()
                })
            });
        }

        // Add bad request response code to every response
        set(config, "openapi.schema.produces.400", {
            body: Joi.object({
                error: Joi.string().required()
            })
        });

        // Add multipart/form-data contenttype on request body
        if (get(config, "openapi.schema.consumes"))
            config.openapi.schema.consumes.contentTypes = [
                "multipart/form-data"
            ];

        for (const response of Object.values(
            get(config, "openapi.schema.produces")
        )) {
            response.contentType = "application/json";
        }

        await openapi.use(new Middleware.Route(config));
        Logger.trace(
            `Added route "${config.method} ${openapi.path}${
                config.path
            }" to web server.`
        );
    } else {
        // It is an object, lets traverse it
        for (const [name, schema] of Object.entries(config.schemas || {})) {
            const mongoSchemaFormat = Joig.convert(schema);
            const mongoSchema = new mongoose.Schema(mongoSchemaFormat);
            mongoSchema
                .path("_id")
                .get(objectid =>
                    objectid ? objectid.id.toString("hex") : objectid
                );
            db.model(name, mongoSchema);
            Logger.trace(`Added schema to database for ${name}.`);
        }
        for (const [path, newConfig] of Object.entries(config.routes || {})) {
            await addRoute(openapi, db, newConfig, [
                ...pathSegments,
                ...path.split("/")
            ]);
        }
    }
}

export default async function initWeb() {
    await server.use(new Middleware.Cors(CORS_OPTIONS));
    await router.use(
        new Middleware.Static({
            path: "/static",
            directory: process.env.TE_STATIC_DIRECTORY
        })
    );
    await router.use(api);

    const db = await DB();

    for (const [apiVersion, config] of Object.entries(API)) {
        Logger.trace(`Processing api ${apiVersion}...`);
        const openapi = new Middleware.OpenApi({
            path: `/${apiVersion}`,
            doc: config.doc
        });
        await api.use(openapi);
        await addRoute(openapi, db, config);
    }

    await server.use(router);
    return server;
}

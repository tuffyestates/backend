import assert from "assert";
import fs from "fs";

import { Server, Middleware } from "ayyo";
import mongoose from "mongoose";
const Joi = require("joi");
const Joig = require("joigoose")(mongoose);

import Logger from "./logger";
import API from "./api";
import DB from "./database";
import { get, set } from "./utils";

// These options define the CORS options used by our CORS middleware
// See https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS for more info
const CORS_OPTIONS = {
  origin: true,
  credentials: true
};

// Ensure TE_SSL_* environmental variables are set
assert(process.env.TE_SSL_CERT_PATH, "No SSL cert path env variable");
assert(process.env.TE_SSL_KEY_PATH, "No SSL key path env variable");

// If neither the SSL key or SSL cert files exist, we can generate some new ones
if (
  !fs.existsSync(process.env.TE_SSL_KEY_PATH) &&
  !fs.existsSync(process.env.TE_SSL_CERT_PATH)
) {
  Logger.warn(
    `No key/cert pair found at [${process.env.TE_SSL_KEY_PATH}, ${
      process.env.TE_SSL_CERT_PATH
    }}]`
  );
  Logger.warn("Attempting to generate key/cert pair!");

  // Generate the key/cert
  const selfsigned = require("selfsigned");
  const attrs = [{ name: "commonName", value: "estates.localhost" }];
  const pems = selfsigned.generate(attrs, {
    days: 365,
    algorithm: "sha256",
    keySize: 2048
  });

  // Write the files
  fs.writeFileSync(process.env.TE_SSL_KEY_PATH, pems.private);
  fs.writeFileSync(process.env.TE_SSL_CERT_PATH, pems.cert);

  Logger.info("Key/cert pair generated successfully.");
}

// Create a new HTTP2 server instance
const server = new Server({
  certPath: process.env.TE_SSL_CERT_PATH,
  privKeyPath: process.env.TE_SSL_KEY_PATH
});

// Register an onError event handler
server.onError = async function onError({ res, error }) {
  res.body = { error: error.message };
  Logger.trace(error);
  Logger.warn(error.data ? error.data.message : error.message);
};

// Create a router to append all of our paths to
const router = new Middleware.Router();

// Create API subrouter
// All paths added to the API subrouter will be prefixed with /api
const api = new Middleware.Router({ path: "/api" });

// Create Json Web Token checking middleware
// This validates the user's JWT token and adds it to the req.jwt variable
const jwt = new Middleware.JsonWebToken({ secret: process.env.TE_SECRET });

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
      config.openapi.schema.consumes.contentTypes = ["multipart/form-data"];

    for (const response of Object.values(
      get(config, "openapi.schema.produces")
    )) {
      response.contentType = "application/json";
    }

    // Add new router using config to the openapi middleware
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
        .get(objectid => (objectid ? objectid.id.toString("hex") : objectid));
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

export default async function initWeb(db) {
  // Make sure our server uses the CORS middleware
  // Without it we are unable to serve cross domain secure requests
  await server.use(new Middleware.Cors(CORS_OPTIONS));

  // Serve the TE_STATIC_DIRECTORY directory without any special processing
  await router.use(
    new Middleware.Static({
      path: "/static",
      directory: process.env.TE_STATIC_DIRECTORY
    })
  );

  // Add out api subrouter to the api router
  await router.use(api);

  for (const [apiVersion, config] of Object.entries(API)) {
    Logger.trace(`Processing api ${apiVersion}...`);
    const openapi = new Middleware.OpenApi({
      path: `/${apiVersion}`,
      doc: config.doc
    });

    // Add a openapi middleware to our api sub router
    await api.use(openapi);

    // Add api to the openapi middleware
    await addRoute(openapi, db, config);
  }

  // Ensure our server is using our path router
  await server.use(router);
  return server;
}

import http2 from "http2";

import Joi from "@hapi/joi";
import bcrypt from "bcrypt";
import { Middleware, HTTPError } from "ayyo";

import DB from "../../../database";
import Logger from "../../../logger";
import {schemas as propertySchemas} from "../properties";

const { HTTP2_HEADER_SET_COOKIE, HTTP2_HEADER_STATUS } = http2.constants;

export const components = require('../globalComponents.js').default;
components.email = Joi.string().email().example("JohnDoe@gmail.com");
components.password = Joi.string().example("WeakPassword123");
components.token = Joi.string()
  .example(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  )
  .notes("The token used to authenticate future requests");

export const schemas = {};
schemas.user = Joi.object({
  email: components.email.required(),
  password: components.password.required()
});

export const tags = ["users"];

const handlers = {};
handlers.register = async function({ req, res }) {
  const database = await DB();

  req.body.password = await bcrypt.hash(req.body.password, 10);

  // Create a database User from the data provided
  let user = new database.models.user(req.body);

  await user.save();

  // Generate a user JWT token, this token contains information on who they
  // are and what permissions they have
  const token = await Middleware.JsonWebToken.sign(
    {
      sub: user.get("_id")
    },
    process.env.TE_SECRET
  );
  res.headers[HTTP2_HEADER_SET_COOKIE] = [
    `token=${token}; Path=/; Secure; HttpOnly; Max-Age=${
      process.env.TE_TOKEN_MAX_AGE
    }`,
    `has-token=1; Path=/; Max-Age=${process.env.TE_TOKEN_MAX_AGE}`
  ];

  Logger.trace(`User registered:`, req.body.email);

  // Set created HTTP response code
  res.headers[HTTP2_HEADER_STATUS] = 201;

  // Set response body to an object containing the token
  res.body = {
    token
  };
};
handlers.login = async function({ req, res }) {
  // Get access to the database
  const database = await DB();

  // Try to find the user using the email provided
  const user = await database.models.user.findOne({
    email: req.body.email
  });

  // If the user wasn't found, notify the client
  if (!user) {
    // Set "bad request" response code
    throw new HTTPError(400, "User not found");
  }

  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) {
    // Set "bad request" response code
    throw new HTTPError(400, "Wrong password");
  }

  // Generate users JWT token
  const token = await Middleware.JsonWebToken.sign(
    {
      sub: user.get("_id")
    },
    process.env.TE_SECRET
  );
  res.headers[HTTP2_HEADER_SET_COOKIE] = [
    `token=${token}; Path=/; Secure; HttpOnly; Max-Age=${
      process.env.TE_TOKEN_MAX_AGE
    }`,
    `has-token=1; Path=/; Max-Age=${process.env.TE_TOKEN_MAX_AGE}`
  ];

  Logger.trace(`User authenticated:`, req.body.email);

  // Send the client their token
  res.body = {
    token,
    id: user.get("_id")
  };
};
handlers.logout = async function({ req, res }) {
  // Clear token cookies on client
  res.headers[HTTP2_HEADER_SET_COOKIE] = [
    `token=""; Path=/; Secure; HttpOnly; Max-Age=0`,
    `has-token=0; Path=/; Max-Age=0`
  ];

  Logger.trace(`User deauthenticated:`, req.jwt.sub);
};
handlers.status = async function({ req, res }) {
  const database = await DB();

  // Try to find the user using the _id provided
  const user = await database.models.user.findOne({
    _id: req.jwt.sub
  });

  // If the user wasn't found, notify the client
  if (!user) {
    // Set "bad request" response code
    throw new HTTPError(400, "User not found");
  }

  res.body = {
    email: user.get("email"),
    id: user.get("_id"),
  };
};
handlers.listings = async function({ req, res }) {
  const database = await DB();

  Logger.trace(`Finding listings with owner:`, req.query.userId || req.jwt.sub);

  // Try to find the user using the _id provided
  const properties = await database.models.property
    .find({
      owner: req.query.userId || req.jwt.sub
    }, {__v: 0})
    .skip(req.query.offset)
    .limit(req.query.limit);

  // Return the properties to client
  res.body = properties.map(p =>
    p.toObject({getters: true, virtuals: false})
  );
};

export const routes = {
  POST: {
    handler: handlers.register,
    openapi: {
      operationId: "registerUser",
      description: "Registers a user",
      tags: ["user"],
      schema: {
        consumes: {
          body: schemas.user
        },
        produces: {
          201: {
            description: "User registered",
            body: Joi.object({
              token: components.token.required()
            })
          }
        }
      }
    }
  },
  "login/POST": {
    handler: handlers.login,
    openapi: {
      operationId: "loginUser",
      description: "Authenticate a user",
      tags: ["user"],
      schema: {
        consumes: {
          body: schemas.user
        },
        produces: {
          200: {
            description: "Token authenticated",
            body: Joi.object({
              token: components.token.required(),
              id: components._id.required()
            })
          }
        }
      }
    }
  },
  "logout/HEAD": {
    handler: handlers.logout,
    openapi: {
      operationId: "logoutUser",
      description: "Deauthenticate a user",
      security: [{ JsonWebToken: [] }],
      tags: ["user"],
      schema: {
        produces: {
          200: {
            description: "Json web token revoked"
          }
        }
      }
    }
  },
  "status/GET": {
    handler: handlers.status,
    openapi: {
      operationId: "userStatus",
      description: "Get the status of a user",
      security: [{ JsonWebToken: [] }],
      tags: ["user"],
      schema: {
        produces: {
          200: {
            description: "Got user status",
            body: Joi.object({
              email: components.email.required(),
              id: components._id.required()
            })
          }
        }
      }
    }
  },
  "listings/GET": {
    handler: handlers.listings,
    openapi: {
      operationId: "userListings",
      description: "Get the status of a user",
      security: [{ JsonWebToken: [] }],
      tags: ["user"],
      schema: {
        consumes: {
          query: Joi.object({
            userId: components._id.meta({ref: "user"}),
            offset: components.offset,
            limit: components.limit,
          })
        },
        produces: {
          200: {
            body: Joi.array().items(
                propertySchemas.property.keys({
                    _id: components._id
                        .meta({ref: "property"}).required()
                })
            )
          }
        }
      }
    }
  }
};

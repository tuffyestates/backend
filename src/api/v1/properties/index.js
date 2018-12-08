import http2 from "http2";

import Joi from "joi";
import {HTTPError} from "ayyo";

import DB from "../../../database";
import Logger from "../../../logger";
import {set} from "../../../utils";

const _id = Joi.string()
    .hex()
    .length(24)
    .example("5bd3ddfdf20ff91132255496");

export const schemas = {};
schemas.property = Joi.object({
    _id: _id
    .meta({type: "ObjectId", ref: "property"}),
    owner: _id
        .meta({type: "ObjectId", ref: "user"})
        .notes("ID of the owner of the property"),
    address: Joi.string()
        .required()
        .example("7266 South Golf Lane"),
    price: Joi.number()
        .integer()
        .min(0)
        .required()
        .example(1640000)
        .notes("Price of the property in USD"),
    description: Joi.string()
        .required()
        .example("A lovely little house by the beach!")
        .notes("Description of the property"),
    location: Joi.object({
        lat: Joi.number()
            .required()
            .example(33.8965908)
            .notes("Latitude"),
        lng: Joi.number()
            .required()
            .example(-117.8825007)
            .notes("Longitude")
    }),
    specification: Joi.object({
        built: Joi.number()
            .integer()
            .required()
            .example(1999)
            .min(1000)
            .max(3000)
            .notes("Year the property was built"),
        lot: Joi.number()
            .required()
            .example(23)
            .min(0)
            .notes("Size of the property in acres"),
        bedrooms: Joi.number()
            .integer()
            .required()
            .example(3)
            .min(0)
            .notes("Number of bedrooms"),
        bathrooms: Joi.number()
            .integer()
            .required()
            .example(2)
            .min(0)
            .notes("Number of bathrooms"),
        size: Joi.number()
            .integer()
            .required()
            .example(4710)
            .min(1)
            .notes("Size of the property in squarefeet")
    })
});

// ////////////////////////////////////// HANDLERS

const handlers = {};
handlers.get = async function({req, res}) {
    // Get database
    const database = await DB();
    Logger.trace("Properties options:", req.query);

    let where = {};

    // Apply filters to where
    req.query['price-min'] && set(where, 'price|$gte', req.query['price-min'], '|');
    req.query['price-max'] && set(where, 'price|$lte', req.query['price-max'], '|');
    req.query['lot-min'] && set(where, 'specification.lot|$gte', req.query['lot-min'], '|');
    req.query['lot-max'] && set(where, 'specification.lot|$lte', req.query['lot-max'], '|');
    req.query['size-min'] && set(where, 'specification.size|$gte', req.query['size-min'], '|');
    req.query['size-max'] && set(where, 'specification.size|$lte', req.query['size-max'], '|');
    req.query['min-bedrooms'] && set(where, 'specification.bedrooms|$gte', req.query['min-bedrooms'], '|');
    req.query['min-bathrooms'] && set(where, 'specification.bathrooms|$gte', req.query['min-bathrooms'], '|');

    // Try to find properties
    const properties = await database.models.property
        .find(where, {__v: 0})
        .skip(req.query.offset || 0)
        .limit(req.query.limit || 20);

    // Return the properties to client
    // FIXME: OMG this is a horrible hack to fix ObjectIds not returning as
    // strings
    res.body = properties.map(p => p.toObject({getters: true, virtuals: false}));
};
handlers.getById = async function({req, res}) {
    // Get database
    const database = await DB();
    Logger.debug({_id: req.params.id});
    // Try to find database with given id
    const property = await database.models.property.findOne(
        {
            _id: req.params.id
        },
        {__v: 0}
    );

    // If the property wasn't found inform the user
    if (!property) {
        throw new HTTPError(400, "Property not found");
    }

    // Return the property
    res.body = property.toObject({getters: true, virtuals: false});
};

// /////////////////////////////////////////////// ROUTES

export const routes = {
    "{id}/GET": {
        handler: handlers.getById,
        openapi: {
            description: "Get a property by ID",
            operationId: "getPropertyById",
            tags: ["properties"],
            schema: {
                consumes: {
                    path: Joi.object({
                        id: _id.notes("UUID of the property to get").required()
                    })
                },
                produces: {
                    200: {
                        body: schemas.property.keys({
                            _id: _id.meta({type: "ObjectId", ref: "property"})
                        })
                    },
                    400: {}
                }
            }
        }
    },
    GET: {
        handler: handlers.get,
        openapi: {
            description: "Get an array of properties",
            operationId: "getProperties",
            tags: ["properties"],
            schema: {
                consumes: {
                    query: Joi.object({
                        offset: Joi.number()
                            .integer()
                            .min(0)
                            .default(0)
                            .example(0)
                            .notes(
                                "Offset your search results. Used for pagination."
                            ),
                        limit: Joi.number()
                            .integer()
                            .min(1)
                            .max(100)
                            .default(20)
                            .example(10)
                            .notes("Max number of results to return."),
                        "price-min": Joi.number()
                            .integer()
                            .min(0)
                            .example(400000)
                            .notes("Lowest price."),
                        "price-max": Joi.number()
                            .integer()
                            .min(0)
                            .example(800000)
                            .notes("Highest price."),
                        "lot-min": Joi.number()
                            .integer()
                            .min(0)
                            .example(20)
                            .notes("Lowest lot size."),
                        "lot-max": Joi.number()
                            .integer()
                            .min(0)
                            .example(40)
                            .notes("Highest lot size."),
                        "size-min": Joi.number()
                            .integer()
                            .min(0)
                            .example(1700)
                            .notes("Lowest squarefeet."),
                        "size-max": Joi.number()
                            .integer()
                            .min(0)
                            .example(4000)
                            .notes("Highest squarefeet."),
                        "min-bedrooms": Joi.number()
                            .integer()
                            .min(1)
                            .max(4)
                            .example(3)
                            .notes("Minimum number of bedrooms."),
                        "min-bathrooms": Joi.number()
                            .integer()
                            .min(1)
                            .max(4)
                            .example(2)
                            .notes("Minimum number of bathrooms.")
                    })
                },
                produces: {
                    200: {
                        body: Joi.array().items(
                            schemas.property.keys({
                                _id: _id.meta({type: "ObjectId", ref: "property"})
                            })
                        )
                    }
                }
            }
        }
    },
    POST: {
        handler: handlers.get,
        openapi: {
            description: "Create a property",
            operationId: "createProperty",
            tags: ["properties"],
            security: [{JsonWebToken: []}],
            schema: {
                consumes: {
                    body: schemas.property.keys({
                        image: Joi.object({
                            filename: Joi.string(),
                            contents: Joi.binary()
                        })
                    })
                },
                produces: {
                    201: {
                        description: "Property created"
                    },
                    400: {
                        body: Joi.object()
                    }
                }
            }
        }
    }
};
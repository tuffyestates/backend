import Path from "path";
import fs from "fs";

import Joi from "joi";
import sharp from "sharp";
import axios from "axios";
import {HTTPError} from "ayyo";

import DB from "../../../database";
import Logger from "../../../logger";
import {set} from "../../../utils";

const fsp = fs.promises;
const _id = Joi.string()
    .hex()
    .length(24)
    .example("5bd3ddfdf20ff91132255496");

export const schemas = {};
schemas.property = Joi.object({
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
    req.query["price-min"] &&
        set(where, "price|$gte", req.query["price-min"], "|");
    req.query["price-max"] &&
        set(where, "price|$lte", req.query["price-max"], "|");
    req.query["lot-min"] &&
        set(where, "specification.lot|$gte", req.query["lot-min"], "|");
    req.query["lot-max"] &&
        set(where, "specification.lot|$lte", req.query["lot-max"], "|");
    req.query["size-min"] &&
        set(where, "specification.size|$gte", req.query["size-min"], "|");
    req.query["size-max"] &&
        set(where, "specification.size|$lte", req.query["size-max"], "|");
    req.query["min-bedrooms"] &&
        set(
            where,
            "specification.bedrooms|$gte",
            req.query["min-bedrooms"],
            "|"
        );
    req.query["min-bathrooms"] &&
        set(
            where,
            "specification.bathrooms|$gte",
            req.query["min-bathrooms"],
            "|"
        );

    // Try to find properties
    const properties = await database.models.property
        .find(where, {__v: 0})
        .skip(req.query.offset || 0)
        .limit(req.query.limit || 20);

    // Return the properties to client
    res.body = properties.map(p =>
        p.toObject({getters: true, virtuals: false})
    );
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
handlers.create = async function({req, res}) {
    const database = await DB();

    const geocode = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
            params: {
                address: req.body.address,
                key: process.env.TE_GOOGLE_API_KEY
            }
        }
    );

    Logger.debug("Got property address:", geocode.data);

    // Check if geocoding request was a success
    if (geocode.data.status !== "OK" || geocode.data.results.length < 1) {
        throw new HTTPError(400, "Invalid property address");
    }

    const address = geocode.data.results[0].formatted_address;
    const location = geocode.data.results[0].geometry.location;

    const property = new database.models.property(
        Object.assign(req.body, {
            owner: req.jwt.sub,
            address,
            location
        })
    );

    // Get newly created property's ID
    const id = property.get("_id");
    const imageBuffer = req.body.image.content;

    await generatePropertyImages({[id]: imageBuffer})

    Logger.trace(`Created property with id: ${id}`);

    // Save property to database
    await property.save();

    // Send back the created property's ID
    res.body = {
        id
    };
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
                    }
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
                                _id: _id.meta({
                                    type: "ObjectId",
                                    ref: "property"
                                })
                            })
                        )
                    }
                }
            }
        }
    },
    POST: {
        handler: handlers.create,
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
                            content: Joi.binary()
                        })
                    })
                },
                produces: {
                    201: {
                        description: "Property created",
                        body: Joi.object({
                            _id: _id
                                .meta({type: "ObjectId", ref: "property"})
                                .notes("Newly created property's ID")
                        })
                    }
                }
            }
        }
    }
};

export async function generatePropertyImages(buffers) {
    let promises = [];
    for (const [id, buffer] of Object.entries(buffers)) {
        const [image, smallerImage, imageThumbnail] = [
            // Primary photo generation
            sharp(buffer).resize({
                width: 3840,
                height: 1080,
                withoutEnlargement: true,
                fit: "cover"
            }),
            // Smaller photo generation
            sharp(buffer).resize({
                width: 500,
                height: 282,
                withoutEnlargement: true,
                fit: "cover"
            }),
            // thumbnail generation
            sharp(buffer).resize(80)
        ];
        const imagePath = Path.join(
            process.env.TE_STATIC_DIRECTORY,
            `property/image/${id}.jpg`
        );

        const smallerImagePath = Path.join(
            process.env.TE_STATIC_DIRECTORY,
            `property/image/${id}-500.jpg`
        );

        const thumbnailPath = Path.join(
            process.env.TE_STATIC_DIRECTORY,
            `property/image/${id}-80.jpg`
        );

        promises = [
            ...promises,
            writePromise(imagePath, image.jpeg().toBuffer()),
            writePromise(smallerImagePath, smallerImage.jpeg().toBuffer()),
            writePromise(
                thumbnailPath,
                imageThumbnail
                    .jpeg({
                        quality: 30
                    })
                    .toBuffer()
            ),
            writePromise(imagePath, image.webp().toBuffer()),
            writePromise(smallerImagePath, smallerImage.webp().toBuffer())
        ];
    }
    await Promise.all(promises);
}

async function writePromise(path, promise) {
    await fsp.writeFile(path, await promise);
}

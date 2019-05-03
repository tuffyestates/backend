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

export const components = require('../globalComponents.js').default;
components.address = Joi.string()
    .required()
    .example("7266 South Golf Lane");
components.price = Joi.number()
    .integer()
    .min(0)
    .required()
    .example(1640000);
components.location = Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array().ordered(
        Joi.number()
            .required()
            .example(33.8965908)
            .notes("Latitude"),
        Joi.number()
            .required()
            .example(-117.8825007)
            .notes("Longitude")
    ).length(2)
});
components.year = Joi.number()
    .integer()
    .example(1999)
    .min(1000)
    .max(3000);
components.acres = Joi.number()
    .example(23)
    .min(0);
components.sqft = Joi.number()
    .integer()
    .example(4710)
    .min(1);

export const schemas = {};
schemas.property = Joi.object({
    owner: components._id
        .meta({ref: "user"})
        .notes("ID of the owner of the property")
        .required(),
    address: components.address.required(),
    price: components.price
        .notes("Price of the property in USD")
        .required(),
    description: Joi.string()
        .example("A lovely little house by the beach!")
        .notes("Description of the property")
        .required(),
    location: components.location.required(),
    specification: Joi.object({
        built: components.year
            .notes("Year the property was built")
            .required(),
        lot: components.acres
            .notes("Size of the property in acres")
            .required(),
        bedrooms: Joi.number()
            .integer()
            .example(3)
            .min(0)
            .notes("Number of bedrooms")
            .required(),
        bathrooms: Joi.number()
            .integer()
            .example(2)
            .min(0)
            .notes("Number of bathrooms")
            .required(),
        size: components.sqft
            .notes("Size of the property in squarefeet")
            .required()
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

    await generatePropertyImages({[id]: imageBuffer});

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
                        id: components._id
                            .meta({ref: "property"})
                            .notes("UUID of the property to get").required()
                    })
                },
                produces: {
                    200: {
                        body: schemas.property.keys({
                            _id: components._id.meta({ref: "property"})
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
                        offset: components.offset,
                        limit: components.limit,
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
                                _id: components._id
                                    .meta({ref: "property"}).required()
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
                    }).forbiddenKeys('owner', 'location')
                },
                produces: {
                    201: {
                        description: "Property created",
                        body: Joi.object({
                            _id: components._id
                                .meta({ref: "property"})
                                .notes("Newly created property's ID")
                                .required()
                        })
                    }
                }
            }
        }
    }
};

export async function generatePropertyImages(buffers) {
    let promises = [];

    // FIXME: This should only be done on server startup, not here...
    const imageDirectory = Path.join(
        process.env.TE_STATIC_DIRECTORY,
        `property/image`
    );
    try {
      await fsp.mkdir(imageDirectory, {recursive: true});
    } catch (e) {
      console.warn(e);
    }

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
            imageDirectory,
            `${id}.jpg`
        );

        const smallerImagePath = Path.join(
            imageDirectory,
            `${id}-500.jpg`
        );

        const thumbnailPath = Path.join(
            imageDirectory,
            `${id}-80.jpg`
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

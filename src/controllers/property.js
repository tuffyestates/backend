import FS from 'fs';
const fs = FS.promises;
import Path from 'path';

import Get from 'lodash.get';
import {
    flatten
} from 'flat';
import sharp from 'sharp';

import DB from '../database';
import Logger from '../logger';
import {
    getDeepKeys
} from '../utils';

async function get(req, res, next) {
    // Get database
    const database = await DB();

    // Try to find database with given id
    const property = await database.models.Property.findOne({
        _id: req.params.id
    });

    // If the property wasn't found inform the user
    if (!property) {
        res.status(400);

        // Set error message
        res.body = {
            error: `Property with id "${req.params.id}" was not found`
        };
        return next();
    }

    // Return the property
    res.body = property;

    next();
}
async function post(req, res, next) {
    const database = await DB();

    const property = new database.models.Property(Object.assign(req.body, {
        owner: req.user.sub
    }));

    // Get newly created property's ID
    const id = property.get('_id');
    const image = req.files.image.filter(i => i.fieldname === 'image')[0];

    // Primary photo generation
    const imageOutputBuffer = await sharp(image.buffer)
        .jpeg()
        .toBuffer();
    const imagePath = Path.join(process.env.TE_STATIC_DIRECTORY, `property/image/${id}.jpg`);
    await fs.writeFile(imagePath, imageOutputBuffer);

    // thumbnail generation
    const imageThumbnailBuffer = await sharp(image.buffer)
        .resize(80)
        .jpeg({
            quality: 30
        })
        .toBuffer();
    const thumbnailPath = Path.join(process.env.TE_STATIC_DIRECTORY, `property/image/${id}-thumbnail.jpg`);
    await fs.writeFile(thumbnailPath, imageThumbnailBuffer);


    Logger.trace(`Created property with id: ${id}`);

    // Save property to database
    await property.save();

    // Send back the created property's ID
    res.body = {
        id
    };

    next();
}
async function patch(req, res, next) {
    const database = await DB();

    const changes = clean(flatten(req.body));
    const property = await database.models.Property.updateOne({
        _id: req.params.id,
        owner: req.user.sub
    }, {
        $set: changes
    });
    if (!property)
        throw new Error(`property with id "${req.params.id}" does not exist, or you do not own it`);

    res.body = {};

    next();
}
async function del(req, res, next) {
    const database = await DB();

    // TODO: Verify current user (via token.sub) is property owner

    const property = await database.models.Property.removeOne({
        _id: req.params.id,
        owner: req.user.sub
    });

    if (!property) {
        res.status(400);

        // Set error message
        res.body = {
            error: `Property with id "${req.params.id}" was not found, or you do not own it`
        };
        return next();
    }


    // Update each field on property with the request payload
    for (const key of getDeepKeys(req.payload)) {
        property.set(key, Get(req.payload, key));
    }

    // Save the update to the server
    await property.save();

    res.body = {};

    next();
}

export default {
    get,
    post,
    patch,
    delete: del
}

// Removes all empty/null/undefined values
function clean(obj) {
    Object.keys(obj).forEach((key) => (obj[key] == null || obj[key] === '') && delete obj[key]);
    return obj;
}

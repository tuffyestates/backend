import DB from '../database';
import Logger from '../logger';
import {getDeepKeys} from '../utils';
import Get from 'lodash.get';

async function get(req, res, next) {
    // Get database
    const database = await DB();

    // Try to find database with given id
    const property = database.models.Property.findOne({_id: req.params.id});

    // If the property wasn't found inform the user
    if (!property) {

        // Set error message
        res.body = {
            error: `Property with id "${req.params.id}" was not found`
        };
        return next();
    }

    // Convert property to a sanatized object we can send
    res.body = property.toObject();

    next();
}
async function post(req, res, next) {
    const database = await DB();
    const property = new database.models.Property(req.body);

    // Get newly created property's ID
    const id = property.get('_id');
    Logger.trace(`Created property with id: ${id}`);

    // Save property to database
    await property.save();

    // Send back the created property's ID
    res.body = {id};

    next();
}
async function patch(req, res, next) {
    const database = await DB();
    // Why not model.update? Please note that the Model.update does not pass the
    // validation defined in the Schema
    const property = database.models.Property.findOne({_id: req.params.id});
    if (!property)
        throw new Error(`property with id "${req.params.id}" does not exist`);

    // TODO: Verify current user (via token.sub) is property owner

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
}

import DB from '../database';
import Logger from '../logger';
import {getDeepKeys} from '../utils';
import Get from 'lodash.get';

async function get(req, res, next) {
    // Get database
    const database = await DB();

    // Try to find database with given id
    const property = await database.models.Property.findById(req.params.id);

    // If the property wasn't found inform the user
    if (!property) {

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

    // TODO: Verify current user (via token.sub) is property owner

    // Why not model.update? Please note that the Model.update does not pass the
    // validation defined in the Schema
    Logger.trace(req.params.id, req.payload)
    // const property = await database.models.Property.findByIdAndUpdate(req.params.id, req.payload);
    if (!property)
        throw new Error(`property with id "${req.params.id}" does not exist`);

    // Update each field on property with the request payload
    // for (const key of getDeepKeys(req.payload)) {
    //     property.set(key, Get(req.payload, key));
    // }

    // Save the update to the server
    // await property.save();

    res.body = {};

    next();
}
async function del(req, res, next) {
    const database = await DB();
    // Why not model.update? Please note that the Model.update does not pass the
    // validation defined in the Schema
    const property = await database.models.Property.findByIdAndRemove(req.params.id);
    if (!property)
        throw new Error(`property with id "${req.params.id}" does not exist`);

    property.remove();

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
    delete: del
}

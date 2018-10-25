import DB from '../database';
import Logger from '../logger';
import {getDeepKeys} from '../utils';
import Get from 'lodash.get';

async function get(req, res, next) {
    const database = await DB();
    const property = database.models.Property.findOne({_id: req.params.id});
    if (!property)
        throw new Error(`property with id "${req.params.id}" does not exist`);

    res.body = property.toObject();

    next();
}
async function post(req, res, next) {
    const database = await DB();
    const property = new database.models.Property(req.payload);
    const id = property.get('_id');
    Logger.trace(`Created property with id: ${id}`);

    await property.save();
    res.body = {id};

    next();
}
async function patch(req, res, next) {
    const database = await DB();
    const property = database.models.Property.findOne({_id: req.params.id});
    if (!property)
        throw new Error(`property with id "${req.params.id}" does not exist`);

    // TODO: Verify current user (via token.sub) is property owner

    for (const key of getDeepKeys(req.payload)) {
        property.set(key, Get(req.payload, key));
    }

    await property.save();

    res.body = {};

    next();
}

export default {
    get,
    post,
    patch,
}

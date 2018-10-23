import DB from '../database';
import Logger from '../logger';

async function get(req, res, next) {
    throw new Error('not implemented');
}
async function post(req, res, next) {
    const database = await DB();
    const property = new database.models.Property(req.payload);
    Logger.trace(property)
    throw new Error('not implemented');
}
async function patch(req, res, next) {
    throw new Error('not implemented');
}

export default {
    get,
    post,
    patch,
}

import DB from '../database';
import Logger from '../logger';

async function get(req, res, next) {
    // Get database
    const database = await DB();
    Logger.trace("Properties options:", req.query)

    // Try to find properties
    const properties = await database.models.Property.find().skip(req.query.offset || 0).limit(req.query.limit || 20);

    // Return the properties to client
    res.body = properties;

    next();
}

export default {
    get
}

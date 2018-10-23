import DB from '../database';
import Logger from '../logger';

async function post(req, res, next) {
    const database = await DB();
    const message = new database.models.Message(req.payload);
    Logger.trace(message)
    throw new Error('not implemented');
}

export default {
    post,
}

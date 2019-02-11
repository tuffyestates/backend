import mongoose from 'mongoose';

import Logger from '../logger';

let databaseSingleton = null;

export default async function initDatabase(url) {

    if (databaseSingleton) {
        return databaseSingleton;
    }

    try {
        await connect(url);
    } catch (e) {
        Logger.debug("First mongodb connection failed. Trying again in 5s.");
        await sleep(5000);
        await connect(url);
    }

    Logger.info(`Connected to database at "${url}".`);

    databaseSingleton = mongoose;
    return mongoose;
}

function connect(url) {
    return mongoose.connect(url, {
        useCreateIndex: true,
        useNewUrlParser: true,
        autoIndex: false
    });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

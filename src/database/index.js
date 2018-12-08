import mongoose from 'mongoose';

import Logger from '../logger';

let databaseSingleton = null;

export default async function initDatabase(url) {

    if (databaseSingleton) {
        return databaseSingleton;
    }

    await mongoose.connect(url, {
        useCreateIndex: true,
        useNewUrlParser: true,
        autoIndex: false
    });
    Logger.info(`Connected to database at "${url}".`);

    databaseSingleton = mongoose;
    return mongoose;
}

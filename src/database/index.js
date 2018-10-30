import fs from 'fs';
import path from 'path';

import jsYaml from "js-yaml";
import mongoose from 'mongoose';

import Logger from '../logger';
import o2m from './o2m.js';

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

    try {
        Logger.info(`Connected to database at "${url}".`);

        const openApiDocument = jsYaml.safeLoad(fs.readFileSync(path.join(__dirname, '../api.yaml'), "utf-8"));

        for (const [name, schema] of Object.entries(o2m(openApiDocument))) {
            mongoose.model(name, schema);
            mongoose.models[name].ensureIndexes();
            Logger.debug(`Created model for "${name}":`);
        }
    } catch (e) {
        mongoose.connection.close();
        throw e;
    }

    databaseSingleton = mongoose;
    return mongoose;
}

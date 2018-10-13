const fs = require('fs');
const path = require('path');

const jsYaml = require("js-yaml");
const mongoose = require('mongoose');

const Logger = require('../logger');
const o2m = require('./o2m.js');

let databaseSingleton = null;

module.exports = async function initDatabase(url) {

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
            Logger.trace(`Created model for "${name}":`);
        }
    } catch (e) {
        mongoose.connection.close();
        throw e;
    }

    databaseSingleton = mongoose;
    return mongoose;
}

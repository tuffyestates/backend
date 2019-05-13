import mongoose from 'mongoose';

// Set getter function for ObjectIds to return a string
mongoose.ObjectId.get(v => typeof v === "object" ? v.toString("hex") : v);

import Logger from '../logger';

let databaseSingleton = null;

export default async function initDatabase(url) {

    // We don't want to reconnect if we are already connected
    if (databaseSingleton) {
        return databaseSingleton;
    }

    // First connect may fail because docker doesn't impose any kind of started
    // conditions
    try {
        await connect(url);
    } catch (e) {
        Logger.debug("First mongodb connection failed. Trying again in 5s.");
        await sleep(5000);
        await connect(url);
    }

    Logger.info(`Connected to database at "${url}".`);

    // Store the database connection for later use
    databaseSingleton = mongoose;

    return mongoose;
}

// Connects to a mongodb database give a url
function connect(url) {
    return mongoose.connect(url, {
        useCreateIndex: true,
        useNewUrlParser: true,
        autoIndex: false
    });
}

// A simple sleep function to wait a few miliseconds before responding
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

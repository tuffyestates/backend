// Initial setup
process.title = `tuffy_estates_backend`;

// -----------------------------------------------------------------------------

import Logger from './logger';
import webServer from './web';
import database from './database';

const PORT = process.env.TE_PORT || 11638;
const DATABASE_URL = process.env.TE_MONGODB_URL || "mongodb://localhost:27017/tuffyestates";

let db, web, app;

export async function start() {
    db = await database(DATABASE_URL);
    web = await webServer(db);
    app = web.listen(PORT, () => Logger.info(`Server listening on`, app.address()));
}
export async function stop() {
    if (app) {
        await app.close();
    }
    if (web) {
        await web.close();
    }
    if (db) {
        await db.disconnect();
    }
}

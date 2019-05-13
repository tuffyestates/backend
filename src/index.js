import sharp from 'sharp';

// Initial setup
process.title = `tuffy_estates_backend`;

// -----------------------------------------------------------------------------

import Logger from './logger';
import webServer from './web';
import database from './database';

let db, web, app;

export async function start() {
    db = await database(process.env.TE_MONGODB_URL);
    web = await webServer(db);
    await web.listen(process.env.TE_PORT);
    Logger.info(`Server listening on`, web.listener.address());
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

if (!sharp.simd())
    Logger.warn('Current sharp installation is not using SIMD instructions!');

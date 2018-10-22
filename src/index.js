// Initial setup
process.title = `tuffy_estates_backend`;

// -----------------------------------------------------------------------------

import Logger from './logger';
import webServer from './web';
import database from './database';

const PORT = process.env.TE_PORT || 11638;
const DATABASE_URL = process.env.TE_MONGODB_URL || "mongodb://localhost:27017/tuffyestates";

export default async function startServer() {
    const db = await database(DATABASE_URL);
    const web = await webServer(db);
    const app = web.listen(PORT, () => Logger.info(`Server listening on`, app.address()));
}

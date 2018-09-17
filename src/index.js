// Initial setup
process.title = `tuffy_estates_backend`;

// -----------------------------------------------------------------------------

const Logger = require('./logger');
const web = require('./web');
const database = require('./database');

const PORT = process.env.TE_PORT || 11638;
const DATABASE_URL = process.env.TE_MONGODB_URL || "mongodb://localhost:27017/tuffyestates";

// A top level async code block
(async () => {

    // Use a try/catch to catch errors
    try {
        let db = await database(DATABASE_URL);
        let app = await web(db);

        app.listen(PORT, () => Logger.info(`Server listening on ${PORT}!`));
    } catch (e) {
        Logger.error("Error initializing server\n", e);
        process.exit(1);
    }

})();

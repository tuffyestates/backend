// Initial setup
process.title = `tuffy_estates_backend`;

// -----------------------------------------------------------------------------

const Logger = require('./logger');
const app = require('./web');

const PORT = process.env.TE_PORT || 11638;

app.listen(PORT, () => Logger.info(`Server listening on ${PORT}!`));

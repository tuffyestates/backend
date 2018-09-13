// Initial setup
process.title = `tuffy_estates_backend`;
const PORT = process.env.TE_PORT || 11638;

// -----------------------------------------------------------------------------

const Logger = require('./logger');

Logger.info('Server started!');

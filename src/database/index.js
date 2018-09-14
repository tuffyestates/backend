const mongoose = require('mongoose');
const Logger = require('../logger');

module.exports = async function initDatabase(url) {
    await mongoose.connect(url, {
        useNewUrlParser: true
    });
    Logger.info(`Connected to database at "${url}".`);

    for (const [name, schema] of Object.entries(require('./schemas'))) {
        mongoose.model(name, new mongoose.Schema(schema));
    }

    return mongoose;
}

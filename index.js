#!/usr/bin/env node
require('dotenv').config();

// eslint-disable-next-line no-global-assign
require = require("esm")(module);
const server = require('./src');
(async () => {
    try {
        await server.start();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error initializing server:\n", e);
        try {
            await server.stop();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Unable to stop server safely:\n", e);
            process.exit(1);
        }
    }
})();

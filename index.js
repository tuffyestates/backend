#!/usr/bin/env node

// This secret is used to create the JWT
if (!process.env.SECRET)
    process.env.SECRET = "vU$Y/+[D;:<XraqlZ/q`lIe~`;\"u2=^H_GEk,@xGY:K4(CMF,'|TSFZAAFM-As)";

// eslint-disable-next-line no-global-assign
require = require("esm")(module);
const startServer = require('./src').default;
(async () => {
    try {
        startServer();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error initializing server:\n", e);
    }
})();

const Tracer = require('nmmes-tracer');


const Logger = new Tracer.Logger({
    transports: [
        new Tracer.transports.Console()
    ]
});

module.exports = Logger;

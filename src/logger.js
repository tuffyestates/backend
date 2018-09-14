const Tracer = require('nmmes-tracer');
const chalk = require('chalk');

const Logger = new Tracer.Logger({
    level: 'trace',
    dateformat: 'llll',
    format: ["<{{=it.title}}> {{=it.message}}",
        {
            warn: "<{{=it.title}}> {{=it.timestamp}} [{{=it.file}}:{{=it.line}}] {{=it.message}}",
            debug: "<{{=it.title}}> {{=it.timestamp}} [{{=it.file}}:{{=it.line}}] {{=it.message}}",
            trace: "<{{=it.title}}> {{=it.timestamp}} ({{=it.method}}) [{{=it.file}}:{{=it.line}}] {{=it.message}}",
            error: "<{{=it.title}}> {{=it.timestamp}} ({{=it.method}}) [{{=it.file}}:{{=it.line}}] {{=it.message}}",
        }
    ],
    filters: !~process.argv.indexOf('--no-color') ? {
        trace: chalk.magenta,
        debug: chalk.blue,
        info: chalk.green,
        warn: chalk.yellow,
        error: chalk.red,
        fatal: chalk.bgRed
    } : {},
    transports: [
        new Tracer.transports.Console()
    ]
});

module.exports = Logger;

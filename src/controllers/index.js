import fs from 'fs';
import path from 'path';

// Serve the api specification file on /api
const apiSpecFile = fs.readFileSync(path.join(__dirname, '../api.yaml'), 'utf8');

export default {
    get: (req, res, next) => {

        // Allow caching of the api file
        // res.append('Last-Modified', new Date());

        res.type('application/yaml');
        res.body = apiSpecFile;
        next();
    },
    users: require('./users.js').default,
    properties: require('./properties.js').default,
    messages: require('./messages.js').default,
}

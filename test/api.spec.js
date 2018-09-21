const fs = require('fs');

const SwaggerParser = require('swagger-parser');
const yaml = require('js-yaml');

(async() => {
    const spec = yaml.safeLoad(fs.readFileSync('./src/api.yaml'));

    try {
        await SwaggerParser.validate(spec);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('API Specifiation Error:', e.toString());
        process.exit(1);
    }

    fs.writeFileSync('./src/api.yaml', yaml.safeDump(spec, {noRefs: true}));
})();

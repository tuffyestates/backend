const fs = require('fs');

const SwaggerParser = require('swagger-parser');
const yaml = require('js-yaml');

(async () => {
    try {
        const spec = yaml.safeLoad(fs.readFileSync('./src/api.yaml'));

        await SwaggerParser.validate(spec);

        fs.writeFileSync('./src/api.yaml', yaml.safeDump(spec, {
            noRefs: true
        }));
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('API Specifiation Error:', e.toString());
        process.exit(1);
    }
})();

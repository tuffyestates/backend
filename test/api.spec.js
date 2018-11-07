const fs = require('fs');

const SwaggerParser = require('swagger-parser');
const yaml = require('js-yaml');

/* eslint-disable no-console */
(async () => {
    console.log("Test started...");
    try {
        const spec = yaml.safeLoad(fs.readFileSync('./src/api.yaml'));

        await SwaggerParser.validate(spec);

        // fs.writeFileSync('./src/api.yaml', yaml.safeDump(spec, {
        //     noRefs: true
        // }));
    } catch (e) {
        console.error('API Specifiation Error:', e.toString());
        process.exit(1);
    }
})();
/* eslint-enable no-console */

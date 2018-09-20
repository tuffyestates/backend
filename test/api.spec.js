const SwaggerParser = require('swagger-parser');

(async() => {
    try {
        await SwaggerParser.validate('./src/api.yaml');
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('API Specifiation Error:', e.toString());
        process.exit(1);
    }
})();

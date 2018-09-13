
const name = `backend-${process.env.CI_ENVIRONMENT_NAME || 'production'}`;

module.exports = {
    apps: [{
        name,
        script: 'index.js',
    }],
};

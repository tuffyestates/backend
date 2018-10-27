
const name = `backend-${process.env.CI_ENVIRONMENT_NAME || 'production'}`;

module.exports = {
    apps: [{
        name,
        max_restarts: 3,
        script: 'index.js',
    }],
};

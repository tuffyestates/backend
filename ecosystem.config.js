
const name = `backend-${process.env.CI_ENVIRONMENT_NAME || 'production'}`;

module.exports = {
    apps: [{
        name,
        min_uptime: 10000, // 10 second min_uptime
        max_restarts: 3,
        script: 'index.js',
    }],
};

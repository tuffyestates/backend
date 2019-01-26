
const name = `te-backend-${process.env.GIT_BRANCH || 'production'}`;

module.exports = {
    apps: [{
        name,
        min_uptime: 10000, // 10 second min_uptime
        max_restarts: 3,
        script: 'index.js',
    }]
};

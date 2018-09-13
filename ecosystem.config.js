
const name = `backend-${process.env.CI_ENVIRONMENT_NAME || ''}`;

module.exports = {
    apps: [{
        name,
        script: 'index.js',
    }],
};

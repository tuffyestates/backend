module.exports = {
    // Generate a secret that is (almost) unique to each user
    generateSecret: async function generateSecret(req) {
        const clientIp = req.headers['X-Forwarded-For'] || req.connection.remoteAddress;
        return clientIp + process.env.SECRET;
    }
};

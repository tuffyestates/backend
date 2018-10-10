const jwt = require('jsonwebtoken');

const DB = require('../database');
const Logger = require('../logger');
const {generateSecret} = require('../utils');

module.exports = {
    // Handle user registration
    post: async function register(req, res, next) {
        let database = await DB();

        // Create a database User from the data provided
        let user = new database.models.User(req.body);

        // Save the user to the database
        await user.save();

        Logger.trace(`User registered:`, req.body.username);

        res.status(201);
        res.body = true;

        next();
    },
    login: {
        post: async function login(req, res, next) {
            var token = jwt.sign({
                sub: 'mongodb-user-objectid',
                permissions: ['user']
            }, await generateSecret(req));

            Logger.trace(`User authenticated:`, req.body.username);

            res.body = {token};

            next();
        }
    },
    logout: {
        head: async function logout(req, res, next) {
            res.body = true;
            next();
        }
    }
}

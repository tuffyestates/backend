import jwt from 'jsonwebtoken';

import DB from '../database';
import Logger from '../logger';
import {generateSecret} from '../utils';

export default {
    // Handle user registration
    post: async function register(req, res, next) {
        const database = await DB();

        // Create a database User from the data provided
        let user = new database.models.User(req.body);
        user.permissions = ['user', 'property'];

        // Save the user to the database
        await user.save();
        
        var token = jwt.sign({
            sub: 'mongodb-user-objectid',
            permissions: ['user']
        }, await generateSecret(req));

        Logger.trace(`User registered:`, req.body.username);

        res.status(201);
        res.body = {token};

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

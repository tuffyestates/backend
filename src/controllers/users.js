import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import DB from "../database";
import Logger from "../logger";
import {
    generateSecret
} from "../utils";

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Lets set secure cookies if the server is also running securely
const SECURE = process.env.TE_SSL_CERT_PATH && process.env.TE_SSL_KEY_PATH;

function signToken(secret, id, permissions) {
    return jwt.sign({
            sub: id,
            permissions: permissions
        },
        secret
    );
}

// Handle user registration
async function register(req, res, next) {
    const database = await DB();

    req.body.password = await bcrypt.hash(req.body.password, 10);

    // Create a database User from the data provided
    let user = new database.models.User(req.body);
    user.permissions = ["user", "property"];

    await user.save();

    // Generate a user JWT token, this token contains information on who they
    // are and what permissions they have
    const token = signToken(await generateSecret(req), user.get('_id'), ['user']);
    res.cookie('token', `Bearer ${token}`, {maxAge: TOKEN_MAX_AGE, httpOnly: false, secure: SECURE, path: '/'});

    Logger.trace(`User registered:`, req.body.username);

    // Set created HTTP response code
    res.status(201);

    // Set response body to an object containing the token
    res.body = {
        token
    };

    next();
}

async function status(req, res, next) {
    const database = await DB();

    // Try to find the user using the _id provided
    const user = await database.models.User.findOne({
        _id: req.user.sub
    });

    // If the user wasn't found, notify the client
    if (!user) {
        // Set "bad request" response code
        res.status(400);
        res.body = {
            error: "User not found"
        };

        // Continue to next request handler
        return next();
    }

    res.body = {
        username: user.get('username')
    };

    next();
}

async function login(req, res, next) {
    // Get access to the database
    const database = await DB();

    // Try to find the user using the username provided
    const user = await database.models.User.findOne({
        username: req.body.username
    });

    // If the user wasn't found, notify the client
    if (!user) {
        // Set "bad request" response code
        res.status(400);
        res.body = {
            error: "User not found"
        };

        // Continue to next request handler
        return next();
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
        // Set "bad request" response code
        res.status(400);
        res.body = {
            error: "Wrong password"
        };
        return next();
    }

    // Generate users JWT token
    const token = signToken(await generateSecret(req), user.get('_id'), ['user']);
    res.cookie('token', `Bearer ${token}`, {maxAge: TOKEN_MAX_AGE, httpOnly: false, secure: SECURE, path: '/'});

    Logger.trace(`User authenticated:`, req.body.username);

    // Send the client their token
    res.body = {
        token
    };

    next();
}

async function logout(req, res, next) {
    res.body = true;
    res.clearCookie('token', {maxAge: TOKEN_MAX_AGE, httpOnly: false, secure: SECURE, path: '/'});
    next();
}

export default {
    post: register,
    status: {
        get: status
    },
    login: {
        post: login
    },
    logout: {
        head: logout
    }
};

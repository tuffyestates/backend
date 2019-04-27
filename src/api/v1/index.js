import * as users from "./users";
import * as properties from "./properties";
import * as offers from "./offers";

// This is the static (non generated) portion of the openapi documentation
export const doc = {
    info: {
        title: "Tuffy Estates",
        version: "v1"
    },
    servers: [
        {
            url: "http://localhost:11638/api",
            description: "Local Development Server"
        },
        {
            url: "http://localhost:11638/api",
            description: "Staging Server"
        },
        {
            url: "https://tuffyestates.sparling.us:11637/api",
            description: "Development Server"
        },
    ],
    tags: [
        {
            name: "user",
            description: "Everything about users"
        },
        {
            name: "properties",
            description: "Everything about Properties"
        },
        {
            name: "messages",
            description: "Everything about messages"
        }
    ],
    components: {
        securitySchemes: {
            JsonWebToken: {
                type: "http",
                schema: "bearer"
            }
        }
    }
};

export const routes = {
    users,
    properties,
    offers
};

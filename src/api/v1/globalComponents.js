import Joi from "@hapi/joi";

const components = {};
components._id = Joi.string()
    .hex()
    .length(24)
    .example("5bd3ddfdf20ff91132255496")
    .meta({type: "ObjectId"});
components.offset = Joi.number()
        .integer()
        .min(0)
        .default(0)
        .example(0)
        .notes("Offset your search results. Used for pagination.");
components.limit = Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .example(10)
        .notes("Max number of results to return.");
export default components;

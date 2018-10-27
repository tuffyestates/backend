const mongoose = require('mongoose');

function openSchema2Mongoose(oas) {
    let properties = {};

    for (let [property, data] of Object.entries(oas.properties || {})) {
        if (data.type === 'object') {
            properties[property] = openSchema2Mongoose(data);
        } else
            properties[property] = {
                type: toType(data.type),
                required: !!~oas.required.indexOf(property)
            };

        for (let [key, val] of Object.entries(data)) {
            if (key.startsWith('x-mongoose-')) {
                properties[property][key.substr(11)] = val;
            }
        }
    }

    return properties;
}

export default function convert(spec) {
    let output = {};
    for (const [name, schema] of Object.entries(spec.components.schemas)) {
        if (schema) {
            output[name] = new mongoose.Schema(openSchema2Mongoose(schema));
        }
    }
    return output;
}

function toType(type) {
    switch (type) {
        case 'array':
            return Array;
        case 'string':
            return String;
        case 'number':
            return Number;
        case 'object':
            return openSchema2Mongoose(type);
        default:
            return undefined;
    }
}

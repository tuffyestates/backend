const mongoose = require('mongoose');

function openSchema2Mongoose(oas) {
    let properties = oas.properties || {};

    for (let [property, data] of Object.entries(properties)) {
        for (let [key, val] of Object.entries(data)) {
            if (key.startsWith('x-mongoose-')) {
                data[key.substr(11)] = val;
            }
        }
    }

    // Handle converting OAS required into mongoose required
    for (const property of oas.required || []) {
        properties[property].required = true;
    }

    return properties;
}

export default function convert(spec) {
    let output = {};
    for (const [name, schema] of Object.entries(spec.components.schemas)) {
        if (schema)
            output[name] = new mongoose.Schema(openSchema2Mongoose(schema));
    }
    return output;
}

const mongoose = require('mongoose');
const jsYaml = require("js-yaml");

function openSchema2Mongoose(oas) {
    return {...oas.properties};
}

module.exports = function(spec) {
    let output = {};
    for (const [name, schema] of Object.entries(spec.components.schema)) {
        output[name] = new mongoose.Schema(openSchema2Mongoose(schema));
    }
    return output;
};

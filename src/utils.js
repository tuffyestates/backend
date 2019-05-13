// https://stackoverflow.com/questions/42674473/get-all-keys-of-a-deep-object-in-javascript
export function getDeepKeys(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
        if (typeof obj[key] === "object") {
            var subkeys = getDeepKeys(obj[key]);
            keys = keys.concat(
                subkeys.map(function(subkey) {
                    return key + "." + subkey;
                })
            );
        }
    }
    return keys;
}

export function set(object, path, value, delimiter = ".") {
    path = Array.isArray(path) ? path : path.split(delimiter);
    const finalPath = path.pop();
    let finalObj = path.reduce((k, v) => k[v] || (k[v] = {}), object);
    finalObj[finalPath] = value;
    return object;
}

export function get(object, path, delimiter = ".") {
    return (Array.isArray(path) ? path : path.split(delimiter)).reduce(
        (k, v) => (k ? k[v] || undefined : undefined),
        object
    );
}

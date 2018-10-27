// Generate a secret that is (almost) unique to each user
export async function generateSecret(req) {
    const clientIp = req.headers['X-Forwarded-For'] || req.connection.remoteAddress;
    return clientIp + process.env.SECRET;
}

// https://stackoverflow.com/questions/42674473/get-all-keys-of-a-deep-object-in-javascript
export function getDeepKeys(obj) {
    var keys = [];
    for(var key in obj) {
        keys.push(key);
        if(typeof obj[key] === "object") {
            var subkeys = getDeepKeys(obj[key]);
            keys = keys.concat(subkeys.map(function(subkey) {
                return key + "." + subkey;
            }));
        }
    }
    return keys;
}

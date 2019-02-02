# Backend for Tuffy Estates

*Only make changes to develop branch, master is stable*

Master is a protected branch, you can only merge into it.

## Live Builds (Demos)
TODO

## Dependencies
* [Git](https://git-scm.com/downloads)
* [Node.js 11+](https://nodejs.org/en/)
* [MongoDB](https://www.mongodb.com/download-center/community)
* [OpenSSL](https://www.openssl.org/source/) to generate ssl key and private certificate
* [Python 2.x.x](https://www.python.org/downloads/) for [sharp](https://www.npmjs.com/package/sharp)'s native bindings

## Developing
Ensure you have a MongoDB database running and accepting connections on `localhost:27017`.

```
git clone git@github.com:tuffyestates/backend.git -b develop
cd backend
npm install
```

In order to run the backend you need an ssl key and certificate to respond to secure requests.
```
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out key.pem
openssl req -key key.pem -x509 -new -days days -out cert.pem
```

Create a `.env` file with the following:
```
TE_SSL_CERT_PATH="./cert.pem"
TE_SSL_KEY_PATH="./key.pem"
```

You can see `.env.sample` for more information.

You will now be able to access the server on [https://localhost:11638](https://localhost:11638).


#### References
https://medium.com/yalantis-mobile/what-technology-stack-do-zillow-redfin-and-realtor-com-use-for-property-listings-b6b1ba695618
https://yalantis.com/blog/mobile-real-estate-app-development-usa-zillow-trulia-apps-technology/
https://patents.google.com/?assignee=Zillow&oq=assignee:Zillow

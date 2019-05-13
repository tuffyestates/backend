echo "Importing users..."
docker-compose -f ../../docker/docker-compose-development.yml exec app mongoimport --uri mongodb://mongo:27017/tuffyestates --mode upsert --collection users --file /usr/src/app/test/data/users.json --verbose --jsonArray
echo "Importing properties..."
docker-compose -f ../../docker/docker-compose-development.yml exec app mongoimport --uri mongodb://mongo:27017/tuffyestates --mode upsert --collection properties --file /usr/src/app/test/data/properties.json --verbose --jsonArray
echo "Importing images... (This may take a while)"
docker-compose -f ../../docker/docker-compose-development.yml exec app node -r esm /usr/src/app/test/tools/importImages.js

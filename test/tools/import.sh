echo "Importing users..."
mongoimport --uri mongodb://localhost:27020/tuffyestates --mode upsert --collection users --file ../data/users.json --verbose --jsonArray
echo "Importing properties..."
mongoimport --uri mongodb://localhost:27020/tuffyestates --mode upsert --collection properties --file ../data/properties.json --verbose --jsonArray
echo "Importing images... (This may take a while)"
docker-compose -f ../../docker/docker-compose-development.yml exec app node -r esm /usr/src/app/test/tools/importImages.js

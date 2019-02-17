# Backend for Tuffy Estates

*Only make changes to the develop branch, master is stable*

Master is a protected branch, you can only merge into it.

## Live Builds (Demos)
TODO

## Dependencies
* Docker Engine 18.06.0+ | Installers: [Mac](https://download.docker.com/mac/stable/Docker.dmg) [Win](https://download.docker.com/win/stable/Docker%20for%20Windows%20Installer.exe)
* [Docker Compose](https://github.com/docker/compose/releases/) 1.23.2+

## Developing

The following will download the source code.
```
$ git clone git@github.com:tuffyestates/backend.git -b develop    # Download the source
$ cd backend    # Change to the newly downloaded backend directory
```

Next you will need to start the docker containers.

##### Unix
```
$ ./run.sh    # Start the docker containers
```

##### Windows
```
$ run.bat    # Start the docker containers
```

You will now be able to access the server on [https://localhost:11638](https://localhost:11638).

## Viewing the database

Download [MongoDB Compass](https://www.mongodb.com/download-center/compass). Upon opening MongoDB Compass, enter `27020` for the port, leave all other settings at their default and hit connect. You should see a tuffyestates database.

#### References
https://medium.com/yalantis-mobile/what-technology-stack-do-zillow-redfin-and-realtor-com-use-for-property-listings-b6b1ba695618
https://yalantis.com/blog/mobile-real-estate-app-development-usa-zillow-trulia-apps-technology/
https://patents.google.com/?assignee=Zillow&oq=assignee:Zillow

#### Geocoding Data Sources
OSM - https://wiki.openstreetmap.org/wiki/Osmosis
http://download.geonames.org/export/dump/

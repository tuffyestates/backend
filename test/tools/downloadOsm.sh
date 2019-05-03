#!/usr/bin/env bash

rsync -Ph --copy-links --stats --append-verify rsync://ftpmirror.your.org/pub/openstreetmap/pbf/planet-latest.osm.pbf openstreetmap

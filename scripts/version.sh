#!/bin/bash

CURRENT_VERSION=`sed -n -e '/current_version =/ s/.*\= *// p' .bumpversion.cfg`
CURRENT_COMMIT=`git rev-parse HEAD`

echo "{\"version\": \"$CURRENT_VERSION\", \"commit\": \"$CURRENT_COMMIT\"}" > static/build/version.json

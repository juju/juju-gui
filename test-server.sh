#!/bin/bash

set -m

node ./test-server.js $1 &
sleep 2
if [ -n "$2" ]; then
    xdg-open http://localhost:8084/test/index.html
    fg %1
else
    mocha-phantomjs -t 40000 http://localhost:8084/test/
    status=$?
    kill %1
    exit $status
fi

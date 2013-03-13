#!/bin/bash

set -m

node ./test-server.js $1 &
sleep 2
if [ -n "$2" ]; then
    xdg-open http://0.0.0.0:8084/test/index.html
    fg %1
else
    mocha-phantomjs http://0.0.0.0:8084/test/index.html
    status=$?
    kill %1
    exit $status
fi

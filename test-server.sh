#!/bin/bash

set -m

node ./test-server.js $1 &
sleep 2
mocha-phantomjs http://localhost:8084/test/index.html
status=$?
kill %1
exit $status

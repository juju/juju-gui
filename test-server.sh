#!/bin/bash

set -m

node ./test-server.js $1 &
sleep 2
xdg-open http://localhost:8084/test/
fg %1

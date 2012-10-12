#!/bin/bash

set -m

node ./test-server.js &
sleep 2
xdg-open http://localhost:8084/test/
fg %1

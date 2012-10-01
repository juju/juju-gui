#!/bin/bash

set -m

node ./test-server.js &
xdg-open http://localhost:8084/test/
fg %1

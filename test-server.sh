#!/bin/bash

set -m

python -m SimpleHTTPServer 8084 &
xdg-open http://localhost:8084/test/
fg %1

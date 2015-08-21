#!/bin/bash

set -m

SERVE_PID="serve_pid"

bin/pserve test.ini & echo $! > $SERVE_PID

MOCHA_PHANTOMJS="node_modules/.bin/mocha-phantomjs"
PHANTOMJS="node_modules/.bin/phantomjs"

finished () {
  echo "Shutting down server."
  kill -9 `cat serve_pid`
  rm $SERVE_PID
}

# Capture ctrl-c
trap 'finished' SIGINT SIGQUIT SIGTERM SIGCHLD

if [ -n "$1" ]; then
  xdg-open http://0.0.0.0:8888/test/index.html
  fg %1
else
  $MOCHA_PHANTOMJS -p $PHANTOMJS -t 40000 http://0.0.0.0:8888/test/index.html
  STATUS=$?
  kill %1
  exit $STATUS
fi

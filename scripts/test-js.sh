#!/bin/bash

set -m

SERVE_PID="serve_pid"

if [ $TEST_PORT ]; then
  PORT=$TEST_PORT
else
  PORT=8888
fi

bin/pserve test.ini test_port=$PORT & echo $! > $SERVE_PID

MOCHA_PHANTOMJS="node_modules/.bin/mocha-phantomjs"
PHANTOMJS="node_modules/mocha-phantomjs/node_modules/phantomjs/bin/phantomjs"

finished () {
  echo "Shutting down server."
  kill -9 `cat serve_pid`
  rm $SERVE_PID
}

# sleep below is required because on slower machines it can take some time for
# pserve to actually start serving the tests.
sleep 2
# trap command needs to be after the sleep command because sleep Sometimes
# causes the trap command to exit.
# Capture ctrl-c
trap 'finished' SIGINT SIGQUIT SIGTERM SIGCHLD

TEST_PATH="http://0.0.0.0:8888/test/index.html"

TEST_PATH="${TEST_PATH/8888/$PORT}"

if [ -n "$1" ]; then
  xdg-open $TEST_PATH
  fg %1
else
  $MOCHA_PHANTOMJS -C -p $PHANTOMJS -t 40000 $TEST_PATH
  STATUS=$?
  kill %1
  exit $STATUS
fi

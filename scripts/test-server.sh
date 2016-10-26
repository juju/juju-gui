#!/bin/bash

set -m

XVFB_PID="xvfb_pid"

# Start the Xvfb to run chromium in for the tests.
Xvfb :99 & echo $! > $XVFB_PID

finished () {
  echo "Shutting down Xvfb."
  kill -9 `cat $XVFB_PID`
  rm $XVFB_PID
}

# Capture ctrl-c
trap 'finished' SIGINT SIGQUIT SIGTERM SIGCHLD

node_modules/.bin/karma start karma.conf.js --browsers Chrome --log-level warn --reporters mocha

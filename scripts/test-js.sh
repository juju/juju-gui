#!/bin/bash

set -m

XVFB_PID="xvfb_pid"

# Start the Xvfb to run chromium in for the tests.
Xvfb :99 & echo $! > $XVFB_PID

finished () {
  echo "Shutting down Xvfb."
  kill -9 `cat xvfb_pid`
  rm $XVFB_PID
}

# Capture ctrl-c
trap 'finished' SIGINT SIGQUIT SIGTERM SIGCHLD

DISPLAY=:99 CHROME_BIN='/usr/bin/chromium-browser' node_modules/.bin/karma start karma.conf.js --single-run --browsers Chrome --log-level warn --reporters mocha

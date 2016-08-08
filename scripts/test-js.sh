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

SINGLE_RUN="--single-run"
# If this script is started with MULTI_RUN then do not
# shut down the runner after the suite completes.
if [ -n "$MULTI_RUN" ]; then
  echo "Starting multi-run."
  SINGLE_RUN=""
fi

DISPLAY=:99 CHROME_BIN='/usr/bin/chromium-browser' node_modules/.bin/karma start karma.conf.js $SINGLE_RUN --browsers Chrome --log-level warn --reporters mocha

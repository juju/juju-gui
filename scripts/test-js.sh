#!/bin/bash

set -m

SERVE_PID="serve_pid"
XVFB_PID="xvfb_pid"

if [ $TEST_PORT ]; then
  PORT=$TEST_PORT
else
  PORT=8888
fi

# Modify the karma.conf.js to have the port for the proxy. This allows us to
# use different ports in CI.
# This needs to be placed before pserve starts or else the server will not
# start properly.
cp karma.conf.js.tmpl karma.conf.js
sed -i -e 's/{TEST_PORT}/'$PORT'/' karma.conf.js
# Start the Xvfb to run chromium in for the tests.
Xvfb :99 & echo $! > $XVFB_PID
# Start the asset server.
bin/pserve test.ini test_port=$PORT & echo $! > $SERVE_PID

finished () {
  echo "Shutting down Xvfb."
  kill -9 `cat $XVFB_PID`
  echo "Shutting down server."
  kill -9 `cat $SERVE_PID`
  rm $SERVE_PID
  rm $XVFB_PID
}

# sleep below is required because on slower machines it can take some time for
# pserve to actually start serving the tests.
sleep 2

# Capture ctrl-c
trap 'finished' SIGINT SIGQUIT SIGTERM SIGCHLD

SINGLE_RUN="--single-run"
# If this script is started with MULTI_RUN then do not
# shut down the runner after the suite completes.
if [ -n "$MULTI_RUN" ]; then
  echo "Starting multi-run."
  SINGLE_RUN=""
fi

DISPLAY=:99 CHROME_BIN='/usr/bin/chromium-browser' node_modules/.bin/karma start karma.conf.js $SINGLE_RUN --browsers Chrome --log-level warn

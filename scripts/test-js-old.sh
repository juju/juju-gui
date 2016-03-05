#!/bin/bash

set -m

SERVE_PID="serve_pid"

if [ $TEST_PORT ]; then
  PORT=$TEST_PORT
else
  PORT=8888
fi

# Modify the karma-mocha-phantom.conf.js to have the port for the proxy
# serviceRelations supplied above. This allows us to use different ports in CI.
# This needs to be placed before pserve starts or else the server will not
# start properly.
cp karma-mocha-phantom.conf.js.tmpl karma-mocha-phantom.conf.js
sed -i -e 's/{TEST_PORT}/'$PORT'/' karma-mocha-phantom.conf.js

bin/pserve test.ini test_port=$PORT & echo $! > $SERVE_PID

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

node_modules/.bin/karma start karma-mocha-phantom.conf.js --single-run --browsers PhantomJS --log-level warn --reporters mocha

#!/bin/bash

set -m

SERVE_PID="serve_pid"

bin/pserve test.ini & echo $! > $SERVE_PID

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

bin/python jujugui/static/gui/src/test/test_browser.py -v

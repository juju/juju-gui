#!/bin/bash

set -m
if [ $MOCHA_NO_COLOR ] ; then
    MOCHA="node_modules/mocha-phantomjs/bin/mocha-phantomjs --no-color"
else
    MOCHA="node_modules/mocha-phantomjs/bin/mocha-phantomjs"
fi

if [ $TEST_PORT ] ; then
    PORT="$TEST_PORT"
else
    PORT="8888"
fi

fn=`tempfile`
(PORT=$PORT node ./test-server.js $1 | tee $fn )  &
sleep 2
if [ -n "$2" ]; then
    xdg-open `cat $fn`
    fg %1
else
    $MOCHA -p node_modules/phantomjs/bin/phantomjs -t 40000 `cat $fn`
    status=$?
    kill %1
    exit $status
fi

rm $fn

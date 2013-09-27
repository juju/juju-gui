#!/bin/bash

set -m

fn=`tempfile`
(node ./test-server.js $1 | tee $fn )  &
sleep 2
if [ -n "$2" ]; then
    xdg-open `cat $fn`
    fg %1
else
    mocha-phantomjs -t 40000 `cat $fn`
    status=$?
    kill %1
    exit $status
fi

rm $fn


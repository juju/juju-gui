#!/usr/bin/env sh

add-apt-repository ppa:chris-lea/node.js
apt-get update
apt-get install -y nodejs imagemagick python-sphinx python-yaml \
  python-tz python-virtualenv python-shelltoolbox python-tornado \
  python-gflags g++ xvfb git

npm install -g jshint@2.1.3 mocha-phantomjs@3.2.0 phantomjs@1.9.1-0
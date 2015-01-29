#!/usr/bin/env sh

add-apt-repository -y ppa:chris-lea/node.js
apt-get update
apt-get install -y nodejs imagemagick python-sphinx python-yaml \
  python-tz python-virtualenv python-shelltoolbox python-tornado \
  python-gflags g++ xvfb git firefox

npm install -g jshint@2.1.3 mocha-phantomjs@3.3.1 phantomjs@1.9.2-6

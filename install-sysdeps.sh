#!/usr/bin/env sh

# Take care to only use 'sudo' when required.
sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install -y nodejs imagemagick python-sphinx python-yaml \
  python-tz python-virtualenv python-shelltoolbox python-tornado \
  python-gflags g++ xvfb git firefox

sudo npm install -g jshint@2.1.3 mocha-phantomjs@3.3.1 phantomjs@1.9.2-6

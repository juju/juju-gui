#!/usr/bin/env sh

# Take care to only use 'sudo' when required.
sudo add-apt-repository -y ppa:yellow/ppa
sudo apt-get update
sudo apt-get install -y nodejs python-sphinx python-yaml \
  python-tz python-virtualenv python-shelltoolbox python-tornado \
  python-gflags g++ xvfb git chromium-browser

sudo npm install -g jshint@2.1.3 react-tools

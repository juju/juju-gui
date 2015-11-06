#!/bin/bash

# This script is provided to help deploy a testable environment for doing QA.
# Usage: qa.sh [environment default=local]

set -x

JUJU=/usr/bin/juju
#JUJU=$GOPATH/bin/juju

environment='local'
if [ ${#@} -eq 1 ]
then
    environment=$1
fi

sudo=''
if [ $environment == 'local' ]
then
    sudo='sudo'
fi

$JUJU switch $environment
sleep 3		# Allow some time to break if the env is wrong.

$sudo $JUJU bootstrap --series=precise --upload-tools
#$JUJU deploy --to 0 cs:~juju-gui/precise/juju-gui
$JUJU deploy cs:~juju-gui/precise/juju-gui
$JUJU set juju-gui juju-gui-source=lp:juju-gui ga-key=''
$JUJU expose juju-gui

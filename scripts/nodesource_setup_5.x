#!/bin/bash

# Discussion, issues and change requests at:
#   https://github.com/nodesource/distributions
#
# Script to install the NodeSource Node.js 5.x repo onto a
# Debian or Ubuntu system.
#
# Run as root or insert `sudo -E` before `bash`:
#
# curl -sL https://deb.nodesource.com/setup_5.x | bash -
#   or
# wget -qO- https://deb.nodesource.com/setup_5.x | bash -
#

export DEBIAN_FRONTEND=noninteractive

print_status() {
    echo
    echo "## $1"
    echo
}

bail() {
    echo 'Error executing command, exiting'
    exit 1
}

exec_cmd_nobail() {
    echo "+ $1"
    bash -c "$1"
}

exec_cmd() {
    exec_cmd_nobail "$1" || bail
}


print_status "Installing the NodeSource Node.js 5.x repo..."


PRE_INSTALL_PKGS=""

# Check that HTTPS transport is available to APT
# (Check snaked from: https://get.docker.io/ubuntu/)

if [ ! -e /usr/lib/apt/methods/https ]; then
    PRE_INSTALL_PKGS="${PRE_INSTALL_PKGS} apt-transport-https"
fi

if [ ! -x /usr/bin/lsb_release ]; then
    PRE_INSTALL_PKGS="${PRE_INSTALL_PKGS} lsb-release"
fi

if [ ! -x /usr/bin/curl ] && [ ! -x /usr/bin/wget ]; then
    PRE_INSTALL_PKGS="${PRE_INSTALL_PKGS} curl"
fi

# Populating Cache
print_status "Populating apt-get cache..."
exec_cmd 'apt-get update'

if [ "X${PRE_INSTALL_PKGS}" != "X" ]; then
    print_status "Installing packages required for setup:${PRE_INSTALL_PKGS}..."
    # This next command needs to be redirected to /dev/null or the script will bork
    # in some environments
    exec_cmd "apt-get install -y${PRE_INSTALL_PKGS} > /dev/null 2>&1"
fi

DISTRO=$(lsb_release -c -s)

check_alt() {
    if [ "X${DISTRO}" == "X${2}" ]; then
        echo
        echo "## You seem to be using ${1} version ${DISTRO}."
        echo "## This maps to ${3} \"${4}\"... Adjusting for you..."
        DISTRO="${4}"
    fi
}

check_alt "Kali"          "sana"     "Debian" "jessie"
check_alt "Debian"        "stretch"  "Debian" "jessie"
check_alt "Linux Mint"    "rafaela"  "Ubuntu" "trusty"
check_alt "Linux Mint"    "rebecca"  "Ubuntu" "trusty"
check_alt "Linux Mint"    "qiana"    "Ubuntu" "trusty"
check_alt "Linux Mint"    "maya"     "Ubuntu" "precise"
check_alt "LMDE"          "betsy"    "Debian" "jessie"
check_alt "elementaryOS"  "luna"     "Ubuntu" "precise"
check_alt "elementaryOS"  "freya"    "Ubuntu" "trusty"
check_alt "Trisquel"      "toutatis" "Ubuntu" "precise"
check_alt "Trisquel"      "belenos"  "Ubuntu" "trusty"
check_alt "BOSS"          "anokha"   "Debian" "wheezy"

if [ "X${DISTRO}" == "Xdebian" ]; then
  print_status "Unknown Debian-based distribution, checking /etc/debian_version..."
  NEWDISTRO=$([ -e /etc/debian_version ] && cut -d/ -f1 < /etc/debian_version)
  if [ "X${DISTRO}" == "X" ]; then
    print_status "Could not determine distribution from /etc/debian_version..."
  else
    DISTRO=$NEWDISTRO
    print_status "Found \"${DISTRO}\" in /etc/debian_version..."
  fi
fi

print_status "Confirming \"${DISTRO}\" is supported..."

if [ -x /usr/bin/curl ]; then
    exec_cmd_nobail "curl -sLf -o /dev/null 'https://deb.nodesource.com/node_5.x/dists/${DISTRO}/Release'"
    RC=$?
else
    exec_cmd_nobail "wget -qO /dev/null -o /dev/null 'https://deb.nodesource.com/node_5.x/dists/${DISTRO}/Release'"
    RC=$?
fi

if [[ $RC != 0 ]]; then
    print_status "Your distribution, identified as \"${DISTRO}\", is not currently supported, please contact NodeSource at https://github.com/nodesource/distributions/issues if you think this is incorrect or would like your distribution to be considered for support"
    exit 1
fi

if [ -f "/etc/apt/sources.list.d/chris-lea-node_js-$DISTRO.list" ]; then
    print_status 'Removing Launchpad PPA Repository for NodeJS...'

    exec_cmd_nobail 'add-apt-repository -y -r ppa:chris-lea/node.js'
    exec_cmd "rm -f /etc/apt/sources.list.d/chris-lea-node_js-${DISTRO}.list"
fi

print_status 'Adding the NodeSource signing key to your keyring...'

if [ -x /usr/bin/curl ]; then
    exec_cmd 'curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -'
else
    exec_cmd 'wget -qO- https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -'
fi

print_status 'Creating apt sources list file for the NodeSource Node.js 5.x repo...'

exec_cmd "echo 'deb https://deb.nodesource.com/node_5.x ${DISTRO} main' > /etc/apt/sources.list.d/nodesource.list"
exec_cmd "echo 'deb-src https://deb.nodesource.com/node_5.x ${DISTRO} main' >> /etc/apt/sources.list.d/nodesource.list"

print_status 'Running `apt-get update` for you...'

exec_cmd 'apt-get update'

print_status 'Run `apt-get install nodejs` (as root) to install Node.js 5.x and npm'

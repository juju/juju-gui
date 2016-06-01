#!/bin/bash

set -e

# Define paths to uitest directories and command.
script_dir=`dirname $0`
root_dir=`realpath $script_dir/../`
uitest_dir=$root_dir/uitest
uitest=$uitest_dir/devenv/bin/uitest

# Define default parameters.
cloud="lxd"
archive=`ls $root_dir/dist/jujugui-*.tar.bz2`
filter="TestGUI"
args=""

# Parse the arguments.
while [[ $# > 0 ]]; do
key="$1"
case $key in
    -c|--cloud)
    cloud="$2"
    shift
    ;;
    --gui-archive)
    archive="$2"
    shift
    ;;
    *)
    if [[ $key == -* ]]; then
        args="$args $key"
    else
        filter=$key
    fi
    ;;
esac
shift
done

# Clone the juju-uitest project if not already done.
if [[ ! -d "$uitest_dir" ]]; then
  git clone git@github.com:CanonicalLtd/juju-uitest.git $uitest_dir
fi

# Pull to get latest uitests.
pushd $uitest_dir
git checkout master
git pull origin master
# Install uitest system and Python dependencies.
make sysdeps setup
popd

# Run the uitests.
echo -e "\nrunning the following:"
echo "$uitest -c $cloud --gui-archive $archive $args $filter"
$uitest -c $cloud --gui-archive $archive $args $filter

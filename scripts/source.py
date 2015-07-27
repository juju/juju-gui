# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).
import os
import shutil
import subprocess
import sys

USAGE_STRING = "Usage: python source.py SRC_LOCATION"
HERE = os.path.dirname(os.path.realpath(__file__))
GUIDIR = os.path.join(HERE, '../jujugui/static/gui')
GUISRC = os.path.join(GUIDIR, 'src')


def main(src_location):
    # Setup the directories
    if os.path.exists(GUISRC):
        if os.path.islink(GUISRC):
            os.unlink(GUISRC)
        else:
            shutil.rmtree(GUISRC)
    elif not os.path.exists(GUIDIR):
        os.makedirs(GUIDIR)

    if not os.path.exists(src_location):
        sys.exit("%s does not exist." % src_location)

    # Import source, either from tarball or from a directory on disk.
    if os.path.isdir(src_location):
        # It's a directory on disk; symlink it to the src location.
        src_location = os.path.abspath(src_location)
        os.symlink(src_location, GUISRC)
    elif os.path.isfile(src_location):
        # It's a tarball; untar it to the src location.
        # We use subprocess instead of tarfile b/c tarfile doesn't handle all
        # compression types.
        cmd = ['tar', '-C', GUIDIR, '-xf', src_location]
        subprocess.check_call(cmd)

        # We want the dir to be src regardless of what the toplevel dir in the
        # tarball is. We can use listdir b/c only 'src', 'build', and whatever the
        # tarball dir is will ever exist.
        os.chdir(GUIDIR)
        tardir = [dir for dir in os.listdir('.') if dir != 'build'][0]
        shutil.move(tardir, 'src')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print USAGE_STRING
        sys.exit(1)
    sys.exit(main(sys.argv[1]))

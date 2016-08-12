Prepare for the Release
-----------------------

Clone a fresh copy from the root repo. Do not attempt a release in your
current working repository as the following commands expect a fresh clone.
Make the clone using:

::

    git clone git@github.com:juju/juju-gui.git gui-release
    cd gui-release

Next you'll want to generate the list of changes for CHANGES.yaml.

::

    git log `git describe --tags --abbrev=0`..HEAD --author 'jujugui' --format='* [%h] %b'

Based on the log output, update the CHANGES.yaml file. If it makes sense, you
may collapse multiple commits into a single entry in the change log. Follow
the existing formatting of the file, including bullets and spaces as the tools
are non-forgiving with respect to format.

Commit the changes to the changelog.

::

    git commit -am "Updating changelog."


Now checkout master and merge in develop.

::

    git checkout master
    git merge develop

Increment the version number using the ``make bumpversion`` target.  If you
are incrementing the patch (major.minor.patch) number then that's all you need
to do, otherwise invoke it as, e.g., ``VPART=minor make bumpversion``.  Note
that the ``bumpversion`` command will increment the version and do a ``git
commit`` so you'll need to ensure your ``user.name`` and ``user.email`` are set
properly first.

::

   make bumpversion
   or
   VPART=minor make bumpversion
   or
   VPART=major make bumpversion

It is possible that bumpversion will change strings other than the ones we
intend.  Have a quick look at the diff and ensure nothing untoward got
changed.

::

    git diff HEAD~1


Test the release
----------------

::

    make check


Really test the release
-----------------------

Test it in the charm on juju 1.25...

::

    # Assuming $REPO is the full path to where your git repos live and $RELEASE
    # is your release number:
    pushd $REPO/juju-gui-charm
    juju-1 bootstrap
    JUJU_GUI_BRANCH=$REPO/juju-gui make package 
    # Ensure you have a link from $JUJU_REPOSITORY/trusty/juju-gui to $REPO/juju-gui-charm.
    juju-1 deploy local:juju-gui
    juju-1 expose juju-gui
    # Test, test test.
    juju-1 destroy-enviroment -y <your env>
    popd

...and in juju 2

::

    make dist
    cp dist/jujugui-*.tar.bz2 $REPO/juju-gui-charm/releases
    pushd $REPO/juju-gui-charm
    juju bootstrap aws aws
    juju deploy . --series=trusty
    juju expose juju-gui
    # Test, test test.
    popd

...and in embedded in juju.

::

    # Note: this assumes the juju you are using is from an up-to-date checkout of juju in your $GOPATH.
    juju upgrade-gui dist/jujugui-$RELEASE.tar.bz2
    juju gui --show-credentials
    # Test, test test.
    juju destroy-controller aws --destroy-all-models -y


Push to github
--------------

::

     git push --tags origin master


Merge changes to develop
------------------------

::

     git checkout develop
     git merge master
     git push origin develop

Update the release on github
----------------------------

You can find the release on github at https://github.com/juju/juju-gui/releases/tag/<the newest tag>. Update the
release notes with the entry from CHANGES.yaml. Upload the dist/jujugui-$RELEASE.tar.bz2 package as a binary.

Congratulations! You've created a release of the juju gui. Depending on the reason for doing so,
you may now need to update the charm as well. You can find it at
https://github.com/juju/juju-gui-charm; read through its release notes for the process to update it.

Also, you may need to request a simplestreams update so that the new GUI release is made available
to Juju 2 users by default. To do so, ping the QA team asking to include a new GUI release
in the GUI simplestreams, and point them to the archive uploaded to github.

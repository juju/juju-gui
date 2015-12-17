Prepare for the Release
-----------------------

Clone a fresh copy from the root repo. Do not attempt a release in your
current working repository as the following commands expect a fresh clone.
Make the clone using:

::

     git clone --branch master git@github.com:juju/juju-gui.git
     cd juju-gui
     git merge origin/develop

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

::

     # Assuming $REPO is where your git repos live:
     make dist
     cp dist/jujugui-*.tar.bz2 $REPO/juju-gui-charm/releases
     pushd $REPO/juju-gui-charm
     juju bootstrap
     make deploy
     # Test, test test.
     popd


Push to github
--------------

::

     git push origin master
     git push --tags origin master


Merge changes to develop
------------------------

::

     git checkout develop
     git merge master
     git push origin develop

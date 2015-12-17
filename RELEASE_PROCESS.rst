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

Test the release
----------------

::

     make check


Push to github
--------------

::

     git push origin master
     git push origin --tags


Merge changes to develop
------------------------

::

     git checkout develop
     git merge master
     git push origin develop

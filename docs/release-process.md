# GUI Release Process

This document outlines the process of creating a distribution archive of the Juju GUI.

### Prepare for the Release

Clone a fresh copy from the root repo. Do not attempt a release in your
current working repository as the following commands expect a fresh clone.
Make the clone using:

```bash
git clone git@github.com:juju/juju-gui.git juju-gui-release
cd juju-gui-release
```

Next you'll want to generate the list of changes for CHANGES.yaml.

```bash
git log `git describe --tags --abbrev=0`..HEAD --author 'jujugui' --format='* [%h] %b'
```

Based on the log output, update the CHANGES.yaml file. If it makes sense, you
may collapse multiple commits into a single entry in the change log. Follow
the existing formatting of the file, including bullets and spaces as the tools
are non-forgiving with respect to format.

Commit the changes to the changelog.

```bash
git commit -am "Updating changelog."
```


Now checkout master and merge in develop.

```bash
git checkout master
git merge develop
```

Increment the version number using the ``make bumpversion`` target.  If you
are incrementing the patch (major.minor.patch) number then that's all you need
to do, otherwise invoke it as, e.g., ``VPART=minor make bumpversion``.  Note
that the ``bumpversion`` command will increment the version and do a ``git
commit`` so you'll need to ensure your ``user.name`` and ``user.email`` are set
properly first.

```bash
 make bumpversion
 or
 VPART=minor make bumpversion
 or
 VPART=major make bumpversion
```

It is possible that bumpversion will change strings other than the ones we
intend.  Have a quick look at the diff and ensure nothing untoward got
changed.

```bash
git diff HEAD~1
```

### Test & QA the release

##### Run the full test suite
```bash
make check
```

##### Test JAAS integration with GUIProxy

```bash
make run
guiproxy -env production
```

##### Test Juju controller integration with a new dist

```bash
make dist
juju bootstrap google google
juju upgrade-gui dist/juju-gui-*.tar.bz2
```

### Push to GitHub

```bash
git push --tags origin master
```

### Sync development branch

```bash
git checkout develop
git merge master
git push origin develop
```

### Create a release on GitHub

You can find the release on github at
https://github.com/juju/juju-gui/releases/tag/<the newest tag>. Update the
release notes with the entry from CHANGES.yaml and upload the
dist/jujugui-2.10.1.tar.bz2 package as a binary.

Congratulations! You've created a release of the Juju GUI.

### Roll out to production

Now that the dist has been created JAAS and SimpleStreams will need to be updated
with it. Follow those docs for detailed instructions on their processes.

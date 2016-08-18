====================
GUI Embedded in Juju
====================

Starting from Juju 2.0, the Juju GUI is served directly by Juju controllers.
Juju uses the GUI releases created from this code base. Controllers serve the
GUI assuming the following is true:

- the release archive is compressed in tar.bz2 format;
- the release archive includes a top directory named "jujugui-{version}" where
  version is semver (like "2.0.1"). This directory includes another "jujugui"
  directory where the actual Juju GUI files live;
- the "jujugui" directory includes a "static" subdirectory with the Juju GUI
  assets to be served statically;
- the "jujugui" directory specifically includes a
  "static/gui/build/app/assets/stack/svg/sprite.css.svg" file, which is
  required to render the Juju GUI index file;
- the "jujugui" directory includes a "templates/index.html.go" file which is
  used to render the Juju GUI index. The template receives at least the
  following variables in its context: "staticURL", "comboURL", "configURL",
  "debug" and "spriteContent". It might receive more variables but cannot
  assume them to be always provided;
- the "jujugui" directory includes a "templates/config.js.go" file which is
  used to render the Juju GUI configuration file. The template receives at
  least the following variables in its context: "base", "host", "socket",
  "controllerSocket", "staticURL", "uuid" and "version". It might receive more
  variables but cannot assume them to be always provided.

When working on new features or reviewing changes, please ensure that all the
assumptions above are respected, and that the template files (index and config)
are kept in sync.

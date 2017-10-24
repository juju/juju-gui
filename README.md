# Juju GUI

The Juju GUI is a web-based GUI for [Juju](https://jujucharms.com). Juju allows
you to deploy, configure, manage, maintain, and scale cloud applications quickly
and efficiently on public clouds, as well as on physical servers, OpenStack, and containers.

The Juju GUI is open source and the code is available on [GitHub](https://github.com/juju/juju-gui).

### Accessing the GUI

The latest release of the Juju GUI is made available to all users of Juju automatically
and can be launched by running `juju gui` in your terminal. For those using
[JAAS](https://jujucharms.com), you can use the GUI by logging into your account
or [creating a new model](https://jujucharms.com/new).

### Issues & Feature Requests

Issues and feature requests are tracked on [GitHub Issues](https://github.com/juju/juju-gui/issues).

### Upgrading the GUI

[JAAS](https://jujucharms.com) users will have their GUI automatically upgraded
whenever there is a new release. For those with their own controllers you can
simply run `juju upgrade-gui`.

### Developing the GUI

Documentation outlining how to develop with the GUI can be found in the `docs/hacking.md` document

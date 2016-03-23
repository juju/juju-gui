# Modifying templates

When modifying the Juju GUI index template file `index.html.mako` please
ensure the change is reflected in the `index.html.go` template. The latter
is used when the Juju GUI is served directly by the Juju controller.
Similarly, when adding or changing options in the Juju GUI configuration file,
make sure you also duplicate the same change in `config.js.go`.
Please keep all these files in sync! Thanks!

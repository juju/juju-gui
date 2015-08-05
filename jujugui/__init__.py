# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

from pyramid.config import Configurator


def main(global_config, **settings):
    """Return a Pyramid WSGI application."""
    config = Configurator(settings=settings)
    return make_application(config)


def make_application(config):
    """Set up the routes and return the WSGI application."""
    # We use two separate included app/routes so that we can
    # have the gui parts behind a separate route from the
    # assets when we embed it in e.g. the storefront.
    # NOTE: kadams54, 2015-08-04: It's very important that assets be listed
    # first; if it isn't, then the jujugui.gui routes override those specified
    # in assets and any asset requests will go to the main app.
    config.include('jujugui.assets')
    config.include('jujugui.gui')
    return config.make_wsgi_app()

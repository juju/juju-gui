# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

from pyramid.config import Configurator
from paste.gzipper import middleware as GzipMiddleware


def main(global_config, **settings):
    """Return a Pyramid WSGI application."""
    config = Configurator(settings=settings)
    return make_application(config)


def make_application(config):
    """Set up the routes and return the WSGI application."""
    config.include('jujugui.gui')
    app = config.make_wsgi_app()
    if config.registry.settings['jujugui.gzip']:
        app = GzipMiddleware(app)
    return app

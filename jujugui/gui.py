# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

import os

from convoy.combo import combo_app
from pyramid.wsgi import wsgiapp2
from pyramid.renderers import JSON

from jujugui import options


_APP_DIR = os.path.split(os.path.abspath(__file__))[0]


def gui(config):
    options.update(config.registry.settings)
    # We use regex separators for the prefix and file sections of the
    # jujugui.ui route to make sure we capture *everything* before the
    # juju-ui section and get the file path as one string rather than
    # several separated by "/".
    config.add_route('jujugui.ui', '/{prefix:.*}juju-ui/{file:.*}')
    config.add_route('jujugui.config', '/config.js')
    config.add_route('jujugui.version', '/version')
    # XXX jcsackett 2015-05-20 As soon as we have a means of getting a version
    # or other indicator from the juju-gui we want to add that as a combo
    # cache buster.
    config.add_route('jujugui.convoy', '/combo')
    js_files = _APP_DIR + '/static/gui/build'
    headers = [('Cache-Control', 'max-age=3600, public')]
    application = combo_app(js_files, additional_headers=headers)
    config.add_view(wsgiapp2(application), route_name='jujugui.convoy')
    config.add_route('jujugui.app', '/*state')
    config.include('pyramid_mako')
    config.add_renderer('prettyjson', JSON(indent=4))
    config.scan('jujugui.views')


def includeme(config):
    return gui(config)

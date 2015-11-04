# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

import json
import logging
import os

from pyramid.httpexceptions import HTTPNotFound
from pyramid.response import FileResponse
from pyramid.view import view_config


ASSET_PATH = os.path.join(
    os.path.dirname(__file__),
    'static',
    'gui',
    'build',
    'app'
    )


log = logging.getLogger('jujugui')


@view_config(
    route_name='jujugui.app',
    renderer='jujugui:templates/index.html.mako',
    http_cache=3600 * 24 * 365)
def app(request):
    """The main Juju GUI JavaScript application."""
    env_uuid = request.matchdict.get('uuid')
    settings = request.registry.settings
    return {
        'config_url': request.route_path('jujugui.config', uuid=env_uuid),
        'convoy_url': request.route_path('jujugui.convoy', uuid=env_uuid),
        'combine': settings['jujugui.combine'],
        'raw': settings['jujugui.raw'],
    }


@view_config(route_name='jujugui.ui')
def juju_ui(request):
    requested_file = request.matchdict.get('file')
    file_path = os.path.join(ASSET_PATH, requested_file)
    try:
        return FileResponse(file_path, request=request)
    except OSError:
        log.info('No such file: %s' % file_path)
        return HTTPNotFound()


@view_config(route_name='jujugui.config', renderer='string')
def config(request):
    """The Juju GUI dynamically generated config.js file.

    This file includes the GUI configuration options, including the Juju API
    configuration.
    """
    settings = request.registry.settings
    request.response.content_type = 'application/javascript'
    sandbox_enabled = settings['jujugui.sandbox']
    jem_url = settings['jujugui.jem_url']
    # If sandbox is enabled then set the password to "admin" so that the
    # Juju GUI will automatically log in.
    user, password = 'admin', 'password'
    if not sandbox_enabled:
        user, password = settings['jujugui.user'], settings['jujugui.password']
    env_uuid = request.matchdict.get('uuid', 'sandbox')
    baseUrl = settings['jujugui.base_url']
    if baseUrl is None:
        if env_uuid == 'sandbox':
            baseUrl = ''
        else:
            baseUrl = '/u/anonymous/{}'.format(env_uuid)
    options = {
        # Base YUI options.
        'auth': settings['jujugui.auth'],
        'serverRouting': False,
        'html5': True,
        'container': '#main',
        'viewContainer': '#main',
        'baseUrl': baseUrl,
        'transitions': False,
        'cachedFonts': False,
        # Debugging options.
        'consoleEnabled': True,
        'simulateEvents': False,
        # The charm store URL and path.
        'charmstoreURL': settings['jujugui.charmstore_url'],
        'apiPath': settings['jujugui.api_path'],
        # WebSocket connection to the Juju API.
        'socket_protocol': 'wss',
        'socket_path': settings['jujugui.socket_path'],
        'user': user,
        'password': password,
        'jujuEnvUUID': request.matchdict.get('uuid', 'sandbox'),
        'jemUrl': jem_url,
        'interactiveLogin': settings['jujugui.interactive_login'],
        # Enable/disable sandbox (demonstration) mode.
        'sandbox': sandbox_enabled,
        'sandboxSocketURL': 'wss://demo.jujucharms.com/ws',
        # XXX frankban: do we still support read-only mode?
        'readOnly': False,
        # Set the GA_key to enable Google Analytics usage and calls.
        # Also implies using cookies.
        'GA_key': settings['jujugui.ga_key'],
        'login_help': (
            'The password for newer Juju clients can be found by locating the '
            'Juju environment file placed in ~/.juju/environments/ with the '
            'same name as the current environment.  For example, if you have '
            'an environment named "production", then the file is named '
            '~/.juju/environments/production.jenv.  Look for the "password" '
            'field in the file, or if that is empty, for the "admin-secret".  '
            'Remove the quotes from the value, and use this to log in.  The '
            'password for older Juju clients (< 1.16) is in '
            '~/.juju/environments.yaml, and listed as the admin-secret for '
            'the environment you are using.  Note that using juju-quickstart '
            '(https:#launchpad.net/juju-quickstart) can automate logging in, '
            'as well as other parts of installing and starting Juju.'),
        # Shows the user dropdown view which contains the login button and
        # hides the get started link.
        'hideLoginButton': sandbox_enabled,
        # Set a juju-core version so the GUI can adapt its available features.
        'jujuCoreVersion': '',
    }
    return 'var juju_config = {};'.format(json.dumps(options))

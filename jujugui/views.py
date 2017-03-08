# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).
import json
import logging
import os
import pkg_resources

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


VERSION = pkg_resources.get_distribution('jujugui').version
log = logging.getLogger('jujugui')


@view_config(
    route_name='jujugui.app',
    renderer='jujugui:templates/index.html.mako',
    http_cache=3600 * 24 * 365)
def app(request):
    """The main Juju GUI JavaScript application."""
    env_uuid = request.matchdict.get('uuid')
    settings = request.registry.settings
    cache_buster = settings.get('jujugui.cachebuster', VERSION)
    # kadams54, 2016-02-01: per https://github.com/juju/juju-gui/issues/1299
    is_standalone = request.domain != 'demo.jujucharms.com'
    logo_url = '' if is_standalone else 'http://jujucharms.com/'

    return {
        'config_url': request.route_path('jujugui.config', uuid=env_uuid),
        'convoy_url': request.route_path(
            'jujugui.convoy', cachebuster=cache_buster, uuid=env_uuid),
        'combine': settings['jujugui.combine'],
        'logo_url': logo_url,
        'raw': settings['jujugui.raw'],
        'static_url': settings['jujugui.static_url'],
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

    user = settings.get('jujugui.user')
    password = settings.get('jujugui.password')
    base_url = settings.get('jujugui.base_url')
    env_uuid = settings.get('jujugui.uuid', 'sandbox')

    charmstore_macaroons = settings.get('jujugui.charmstore_macaroons')
    discharge_token = settings.get('jujugui.discharge_token')
    plans_macaroons = settings.get('jujugui.plans_macaroons')
    terms_macaroons = settings.get('jujugui.terms_macaroons')

    if sandbox_enabled:
        user = user if user is not None else 'admin'
        password = password if password is not None else 'password'

    if settings.get('jujugui.insecure', False):
        socket_protocol = 'ws'
    else:
        socket_protocol = 'wss'

    gisfLogout = '/logout' if settings['jujugui.gisf'] else None

    options = {
        # Base YUI options.
        'auth': settings['jujugui.auth'],
        'serverRouting': False,
        'container': '#main',
        'viewContainer': '#main',
        'baseUrl': base_url,
        'transitions': False,
        # XXX kadams54: cachedFonts doesn't appear to be used anywhere.
        'cachedFonts': False,
        # Debugging options.
        'consoleEnabled': True,
        # The external services' URLs.
        'bundleServiceURL': settings['jujugui.bundleservice_url'],
        'charmstoreURL': settings['jujugui.charmstore_url'],
        'plansURL': settings['jujugui.plans_url'],
        'paymentURL': settings['jujugui.payment_url'],
        'termsURL': settings['jujugui.terms_url'],
        # Any provided macaroons.
        'dischargeToken': discharge_token,
        'charmstoreMacaroons': charmstore_macaroons,
        'plansMacaroons': plans_macaroons,
        'termsMacaroons': terms_macaroons,
        # WebSocket connection to the Juju API.
        'socket_protocol': socket_protocol,
        'user': user,
        'password': password,
        'jujuEnvUUID': env_uuid,
        'interactiveLogin': settings['jujugui.interactive_login'],
        # Enable/disable sandbox (demonstration) mode.
        'sandbox': sandbox_enabled,
        'sandboxSocketURL': 'wss://demo.jujucharms.com/ws',
        # XXX frankban: do we still support read-only mode?
        'readOnly': False,
        # Set the GTM_enabled to enable Google Tag Manager usage and calls.
        # Also implies using cookies.
        'GTM_enabled': settings['jujugui.GTM_enabled'],
        # Set a juju-core version so the GUI can adapt its available features.
        'jujuCoreVersion': settings.get('jujugui.jujuCoreVersion', ''),
        'apiAddress': settings.get('jujugui.apiAddress', ''),
        'controllerSocketTemplate': settings[
            'jujugui.controllerSocketTemplate'],
        'socketTemplate': settings['jujugui.socketTemplate'],
        'gisf': settings['jujugui.gisf'],
        'staticURL': settings['jujugui.static_url'],
        'gisfLogout': gisfLogout,
        'shareFlag': False,
        'payFlag': False,
    }
    return 'var juju_config = {};'.format(json.dumps(options))


@view_config(route_name='jujugui.version', renderer='prettyjson')
def version(request):
    return {'version': VERSION}

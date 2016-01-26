# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

import functools

from pyramid.settings import asbool


# Define default values for options.
DEFAULT_CHARMSTORE_URL = 'https://api.jujucharms.com/charmstore/'
DEFAULT_API_PATH = 'v4'


def update(settings):
    """Normalize and update the Juju GUI app settings.

    Modify the given settings object in place.
    """
    _update(settings, 'jujugui.auth', default=None)
    _update(settings, 'jujugui.base_url', default=None)
    _update(settings, 'jujugui.charmstore_url', default=DEFAULT_CHARMSTORE_URL)
    _update(settings, 'jujugui.api_path', default=DEFAULT_API_PATH)
    _update(settings, 'jujugui.GTM_enabled', default=False)
    _update(settings, 'jujugui.password', default=None)
    _update(settings, 'jujugui.user', default='')
    _update(
        settings, 'jujugui.socketTemplate', default='/environment/$uuid/api')
    _update(settings, 'jujugui.jem_url', default=None)
    _update_bool(settings, 'jujugui.interactive_login', default=False)
    _update_bool(settings, 'jujugui.sandbox', default=False)
    _update_bool(settings, 'jujugui.raw', default=False)
    _update_bool(settings, 'jujugui.combine', default=True)
    _update_bool(settings, 'jujugui.gzip', default=True)


def _update(settings, name, default=None, convert=lambda value: value):
    """Update the value with the given name on the given settings.

    If the value is not found in settings, or it is empty, the given default is
    used. If a convert callable is provided, it is called on the resulting
    value.

    Modify the given settings object in place.
    """
    val = settings.get(name, default)
    if val == '' or val is None:
        val = default
    settings[name] = convert(val)


_update_bool = functools.partial(_update, convert=asbool)

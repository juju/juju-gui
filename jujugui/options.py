# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

import functools

from pyramid.settings import asbool


# Define default values for options.
DEFAULT_CHARMSTORE_URL = 'https://api.jujucharms.com/charmstore/'


def update(settings):
    """Normalize and update the Juju GUI app settings.

    Modify the given settings object in place.
    """
    _update(settings, 'jujugui.charmstore_url', default=DEFAULT_CHARMSTORE_URL)
    _update(settings, 'jujugui.ga_key', default='')
    _update(settings, 'jujugui.baseUrl', default=None)
    _update_bool(settings, 'jujugui.sandbox', default=False)
    _update_bool(settings, 'jujugui.raw', default=False)
    _update_bool(settings, 'jujugui.combine', default=True)


def _update(settings, name, default=None, convert=lambda value: value):
    """Update the value with the given name on the given settings.

    If the value is not found in settings, or it is empty, the given default is
    used. If a convert callable is provided, it is called on the resulting
    value.

    Modify the given settings object in place.
    """
    settings[name] = convert(settings.get(name, default) or default)


_update_bool = functools.partial(_update, convert=asbool)

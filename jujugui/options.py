# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

import functools

from pyramid.settings import asbool


# Define default values for options.
DEFAULT_BUNDLESERVICE_URL = 'https://api.jujucharms.com/bundleservice/'
DEFAULT_CHARMSTORE_URL = 'https://api.jujucharms.com/charmstore/'
DEFAULT_PLANS_URL = 'https://api.jujucharms.com/omnibus/'
DEFAULT_PAYMENT_URL = 'https://api.jujucharms.com/payment/'
DEFAULT_TERMS_URL = 'https://api.jujucharms.com/terms/'


def update(settings):
    """Normalize and update the Juju GUI app settings.

    Modify the given settings object in place.
    """
    _update(settings, 'jujugui.apiAddress', default=None)
    _update(settings, 'jujugui.auth', default=None)
    _update(settings, 'jujugui.base_url', default='')
    _update(settings, 'jujugui.bundleservice_url',
            default=DEFAULT_BUNDLESERVICE_URL)
    _update(settings, 'jujugui.charmstore_url', default=DEFAULT_CHARMSTORE_URL)
    _update(settings, 'jujugui.controllerSocketTemplate', default='/api')
    _update(settings, 'jujugui.GTM_enabled', default=False)
    _update(settings, 'jujugui.password', default=None)
    _update(settings, 'jujugui.plans_url', default=DEFAULT_PLANS_URL)
    _update(settings, 'jujugui.payment_url', default=DEFAULT_PAYMENT_URL)
    _update(settings, 'jujugui.terms_url', default=DEFAULT_TERMS_URL)
    _update(settings, 'jujugui.socketTemplate', default='/model/$uuid/api')
    _update(settings, 'jujugui.static_url', default='')
    _update(settings, 'jujugui.user', default=None)

    _update_bool(settings, 'jujugui.combine', default=True)
    _update_bool(settings, 'jujugui.gisf', default=False)
    _update_bool(settings, 'jujugui.gzip', default=True)
    _update_bool(settings, 'jujugui.insecure', default=False)
    _update_bool(settings, 'jujugui.interactive_login', default=False)
    _update_bool(settings, 'jujugui.raw', default=False)
    _update_bool(settings, 'jujugui.sandbox', default=False)


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

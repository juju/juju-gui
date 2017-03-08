# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

from copy import deepcopy
import unittest

from jujugui import options


class TestUpdate(unittest.TestCase):

    default_settings = {
        'jujugui.auth': None,
        'jujugui.base_url': '',
        'jujugui.bundleservice_url': options.DEFAULT_BUNDLESERVICE_URL,
        'jujugui.charmstore_url': options.DEFAULT_CHARMSTORE_URL,
        'jujugui.combine': True,
        'jujugui.gisf': False,
        'jujugui.GTM_enabled': False,
        'jujugui.gzip': True,
        'jujugui.insecure': False,
        'jujugui.interactive_login': False,
        'jujugui.password': None,
        'jujugui.plans_url': options.DEFAULT_PLANS_URL,
        'jujugui.raw': False,
        'jujugui.sandbox': False,
        'jujugui.apiAddress': None,
        'jujugui.controllerSocketTemplate': '/api',
        'jujugui.socketTemplate': '/model/$uuid/api',
        'jujugui.static_url': '',
        'jujugui.terms_url': options.DEFAULT_TERMS_URL,
        'jujugui.payment_url': options.DEFAULT_PAYMENT_URL,
        'jujugui.user': None,
    }

    def test_default_values(self):
        settings = {}
        options.update(settings)
        defaults = deepcopy(self.default_settings)
        self.assertEqual(defaults, settings)

    def test_customized_values(self):
        expected_settings = {
            'jujugui.auth': 'blob',
            'jujugui.base_url': '/another/url',
            'jujugui.bundleservice_url': 'https://1.2.3.4/bundleservice',
            'jujugui.charmstore_url': 'https://1.2.3.4/api/',
            'jujugui.combine': True,
            'jujugui.gisf': True,
            'jujugui.GTM_enabled': True,
            'jujugui.gzip': False,
            'jujugui.insecure': True,
            'jujugui.interactive_login': False,
            'jujugui.password': 'Secret!',
            'jujugui.plans_url': 'https://1.2.3.4/plans-api/',
            'jujugui.raw': False,
            'jujugui.sandbox': True,
            'jujugui.apiAddress': 'wss://api.address',
            'jujugui.controllerSocketTemplate': '/my-api',
            'jujugui.socketTemplate': '/juju/api/$host/$port/$uuid',
            'jujugui.static_url': '/horizon/juju',
            'jujugui.payment_url': 'https://1.2.3.4/payment-api/',
            'jujugui.terms_url': 'https://1.2.3.4/terms-api/',
            'jujugui.user': 'who',
        }
        settings = {
            'jujugui.auth': 'blob',
            'jujugui.base_url': '/another/url',
            'jujugui.bundleservice_url': 'https://1.2.3.4/bundleservice',
            'jujugui.charmstore_url': 'https://1.2.3.4/api/',
            'jujugui.combine': 'true',
            'jujugui.gisf': True,
            'jujugui.GTM_enabled': True,
            'jujugui.gzip': 'false',
            'jujugui.insecure': True,
            'jujugui.interactive_login': 'false',
            'jujugui.password': 'Secret!',
            'jujugui.plans_url': 'https://1.2.3.4/plans-api/',
            'jujugui.raw': 'off',
            'jujugui.sandbox': 'on',
            'jujugui.apiAddress': 'wss://api.address',
            'jujugui.controllerSocketTemplate': '/my-api',
            'jujugui.socketTemplate': '/juju/api/$host/$port/$uuid',
            'jujugui.static_url': '/horizon/juju',
            'jujugui.payment_url': 'https://1.2.3.4/payment-api/',
            'jujugui.terms_url': 'https://1.2.3.4/terms-api/',
            'jujugui.user': 'who',
        }
        options.update(settings)
        self.assertEqual(expected_settings, settings)

    def test_empty_values(self):
        settings = dict((k, '') for k in self.default_settings)
        options.update(settings)
        defaults = deepcopy(self.default_settings)
        self.assertEqual(defaults, settings)

    def test_none_returned(self):
        self.assertIsNone(options.update({}))

    def test_false_non_defaults(self):
        settings = {'jujugui.gzip': False}
        options.update(settings)
        self.assertFalse(settings['jujugui.gzip'])

# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

from copy import deepcopy
import unittest

from jujugui import options


class TestUpdate(unittest.TestCase):

    default_settings = {
        'jujugui.api_path': options.DEFAULT_API_PATH,
        'jujugui.auth': None,
        'jujugui.base_url': None,
        'jujugui.charmstore_url': options.DEFAULT_CHARMSTORE_URL,
        'jujugui.combine': True,
        'jujugui.ga_key': '',
        'jujugui.gzip': True,
        'jujugui.interactive_login': False,
        'jujugui.jem_url': None,
        'jujugui.password': None,
        'jujugui.raw': False,
        'jujugui.sandbox': False,
        'jujugui.socketTemplate': '/environment/$uuid/api',
        'jujugui.user': '',
    }

    def test_default_values(self):
        settings = {}
        options.update(settings)
        defaults = deepcopy(self.default_settings)
        self.assertEqual(defaults, settings)

    def test_customized_values(self):
        expected_settings = {
            'jujugui.api_path': 'v4',
            'jujugui.auth': 'blob',
            'jujugui.base_url': '/another/url',
            'jujugui.charmstore_url': 'https://1.2.3.4/api/',
            'jujugui.combine': True,
            'jujugui.ga_key': 'my-key',
            'jujugui.gzip': False,
            'jujugui.interactive_login': False,
            'jujugui.jem_url': 'http://1.2.3.4:8082',
            'jujugui.password': 'Secret!',
            'jujugui.raw': False,
            'jujugui.sandbox': True,
            'jujugui.socketTemplate': '/juju/api/$host/$port/$uuid',
            'jujugui.user': 'who',
        }
        settings = {
            'jujugui.api_path': 'v4',
            'jujugui.auth': 'blob',
            'jujugui.base_url': '/another/url',
            'jujugui.charmstore_url': 'https://1.2.3.4/api/',
            'jujugui.combine': 'true',
            'jujugui.ga_key': 'my-key',
            'jujugui.gzip': 'false',
            'jujugui.interactive_login': 'false',
            'jujugui.jem_url': 'http://1.2.3.4:8082',
            'jujugui.password': 'Secret!',
            'jujugui.raw': 'off',
            'jujugui.sandbox': 'on',
            'jujugui.socketTemplate': '/juju/api/$host/$port/$uuid',
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

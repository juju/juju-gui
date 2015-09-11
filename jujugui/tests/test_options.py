# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

from copy import deepcopy
import unittest

from jujugui import options


class TestUpdate(unittest.TestCase):

    default_settings = {
        'jujugui.charmstore_url': options.DEFAULT_CHARMSTORE_URL,
        'jujugui.ga_key': '',
        'jujugui.sandbox': False,
        'jujugui.raw': False,
        'jujugui.combine': True,
    }

    def test_default_values(self):
        settings = {}
        options.update(settings)
        defaults = deepcopy(self.default_settings)
        defaults['jujugui.baseUrl'] = None
        self.assertEqual(defaults, settings)

    def test_customized_values(self):
        expected_settings = {
            'jujugui.charmstore_url': 'https://1.2.3.4/api/',
            'jujugui.ga_key': 'my-key',
            'jujugui.sandbox': True,
            'jujugui.raw': False,
            'jujugui.combine': True,
            'jujugui.baseUrl': None,
        }
        settings = {
            'jujugui.charmstore_url': 'https://1.2.3.4/api/',
            'jujugui.ga_key': 'my-key',
            'jujugui.sandbox': 'on',
            'jujugui.raw': 'off',
            'jujugui.combine': 'true',
        }
        options.update(settings)
        self.assertEqual(expected_settings, settings)

    def test_empty_values(self):
        settings = dict((k, '') for k in self.default_settings)
        options.update(settings)
        defaults = deepcopy(self.default_settings)
        defaults['jujugui.baseUrl'] = None
        self.assertEqual(defaults, settings)

    def test_none_returned(self):
        self.assertIsNone(options.update({}))

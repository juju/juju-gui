# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

import unittest

from jujugui import options


class TestUpdate(unittest.TestCase):

    default_settings = {
        'jujugui.charmstore_url': options.DEFAULT_CHARMSTORE_URL,
        'jujugui.ga_key': '',
        'jujugui.sandbox': False,
    }

    def test_default_values(self):
        settings = {}
        options.update(settings)
        self.assertEqual(self.default_settings, settings)

    def test_customized_values(self):
        expected_settings = {
            'jujugui.charmstore_url': 'https://1.2.3.4/api/',
            'jujugui.ga_key': 'my-key',
            'jujugui.sandbox': True,
        }
        settings = {
            'jujugui.charmstore_url': 'https://1.2.3.4/api/',
            'jujugui.ga_key': 'my-key',
            'jujugui.sandbox': 'on',
        }
        options.update(settings)
        self.assertEqual(expected_settings, settings)

    def test_empty_values(self):
        settings = dict((k, '') for k in self.default_settings)
        options.update(settings)
        self.assertEqual(self.default_settings, settings)

    def test_none_returned(self):
        self.assertIsNone(options.update({}))

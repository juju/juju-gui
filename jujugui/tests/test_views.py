# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

import json
import unittest

from pyramid import testing

import jujugui
from jujugui import (
    gui,
    options,
    views,
)


class ViewTestCase(unittest.TestCase):

    settings = {}

    def setUp(self):
        self.request = testing.DummyRequest()
        self.config = testing.setUp(
            request=self.request, settings=self.settings)

    def tearDown(self):
        testing.tearDown()

    def update_settings(self, values):
        """Update the application settings with the given values dict."""
        self.config.registry.settings.update(values)


class AppTests(ViewTestCase):

    def test_standalone(self):
        jujugui.make_application(self.config)
        expected_context = {
            'config_url': '/config.js',
            'convoy_url': '/combo',
            'raw': False,
            'combine': True,
        }
        context = views.app(self.request)
        self.assertEqual(expected_context, context)

    def test_included(self):
        gui.includeme(self.config)
        expected_context = {
            'config_url': '/config.js',
            'convoy_url': '/combo',
            'raw': False,
            'combine': True,
        }
        self.request.matchdict['uuid'] = 'env-uuid'
        context = views.app(self.request)
        self.assertEqual(expected_context, context)


class ConfigTests(ViewTestCase):

    def check_response(self, response):
        """Ensure the config response is well formed.

        Return the configuration options.
        """
        prefix, postfix = 'var juju_config = ', ';'
        self.assertTrue(response.startswith(prefix))
        self.assertTrue(response.endswith(postfix))
        data = response[len(prefix):-len(postfix)]
        config = json.loads(data)
        self.assertTrue(config)
        return config

    def test_default_options(self):
        jujugui.make_application(self.config)
        response = views.config(self.request)
        config = self.check_response(response)
        self.assertEqual('wss', config['socket_protocol'])
        self.assertEqual(
            options.DEFAULT_CHARMSTORE_URL, config['charmstoreURL'])
        self.assertEqual('', config['GA_key'])
        # Note that here we are testing that the value is actually True or
        # False, not that it just evaluates to True/False(like in assertTrue).
        self.assertIs(True, config['consoleEnabled'])
        self.assertIs(False, config['hideLoginButton'])
        self.assertEqual('', config['jujuCoreVersion'])
        self.assertIs(False, config['sandbox'])
        self.assertEqual('user-admin', config['user'])
        self.assertIsNone(config['password'])

    def test_customized_options(self):
        self.update_settings({
            'jujugui.charmstore_url': '1.2.3.4/api',
            'jujugui.ga_key': 'my-key',
            'jujugui.sandbox': 'true',
        })
        jujugui.make_application(self.config)
        response = views.config(self.request)
        config = self.check_response(response)
        self.assertEqual('1.2.3.4/api', config['charmstoreURL'])
        self.assertEqual('my-key', config['GA_key'])
        # Note that here we are testing that the value is actually True or
        # False, not that it just evaluates to True/False(like in assertTrue).
        self.assertIs(True, config['sandbox'])
        self.assertEqual('user-admin', config['user'])
        # The hideLoginButton and password values reflect sandbox status.
        self.assertIs(True, config['hideLoginButton'])
        self.assertEqual('admin', config['password'])

    def test_standalone(self):
        jujugui.make_application(self.config)
        response = views.config(self.request)
        config = self.check_response(response)
        self.assertEqual('sandbox', config['jujuEnvUUID'])
        self.assertEqual('', config['baseUrl'])

    def test_included(self):
        jujugui.gui.includeme(self.config)
        self.request.matchdict['uuid'] = 'env-uuid'
        response = views.config(self.request)
        config = self.check_response(response)
        self.assertEqual('env-uuid', config['jujuEnvUUID'])
        self.assertEqual('/u/anonymous/env-uuid', config['baseUrl'])

    def test_explicit_baseUrl(self):
        settings = {'jujugui.baseUrl': '/ignore/prefix'}
        self.config = testing.setUp(
            request=self.request, settings=settings)
        jujugui.make_application(self.config)
        response = views.config(self.request)
        config = self.check_response(response)
        self.assertEqual('sandbox', config['jujuEnvUUID'])
        self.assertEqual('/ignore/prefix', config['baseUrl'])

# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

import json
import pkg_resources
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
        self.update_settings({'jujugui.cachebuster': 'foo'})
        jujugui.make_application(self.config)
        expected_context = {
            'config_url': '/config.js',
            'convoy_url': '/foo/combo',
            'raw': False,
            'logo_url': '',
            'combine': True,
        }
        context = views.app(self.request)
        self.assertEqual(expected_context, context)

    def test_included(self):
        self.update_settings({'jujugui.cachebuster': 'foo'})
        gui.includeme(self.config)
        expected_context = {
            'config_url': '/config.js',
            'convoy_url': '/foo/combo',
            'raw': False,
            'logo_url': '',
            'combine': True,
        }
        self.request.matchdict['uuid'] = 'env-uuid'
        context = views.app(self.request)
        self.assertEqual(expected_context, context)

    def test_sandbox_logo_url(self):
        self.update_settings({
            'jujugui.cachebuster': 'foo',
        })
        self.request.domain = 'demo.jujucharms.com'
        gui.includeme(self.config)
        expected_context = {
            'config_url': '/config.js',
            'convoy_url': '/foo/combo',
            'raw': False,
            'logo_url': 'http://jujucharms.com/',
            'combine': True,
        }
        context = views.app(self.request)
        self.assertEqual(expected_context, context)

    def test_cache_busting_defaults_to_version(self):
        jujugui.make_application(self.config)
        version = views.VERSION
        expected_convoy_url = '/{}/combo'.format(version)
        convoy_url = views.app(self.request)['convoy_url']
        self.assertEqual(expected_convoy_url, convoy_url)


class VersionTest(ViewTestCase):

    def test_version(self):
        expected_version = pkg_resources.get_distribution('jujugui').version
        jujugui.make_application(self.config)
        version = views.version(self.request).get('version')
        self.assertEqual(expected_version, version)


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
        self.assertFalse(config['GTM_enabled'])
        # Note that here we are testing that the value is actually True or
        # False, not that it just evaluates to True/False(like in assertTrue).
        self.assertIs(True, config['consoleEnabled'])
        self.assertEqual('', config['jujuCoreVersion'])
        self.assertIs(False, config['sandbox'])
        self.assertIsNone(config['user'])
        self.assertIsNone(config['password'])
        self.assertEqual('', config['baseUrl'])
        self.assertIsNone(config['auth'])

    def test_customized_options(self):
        self.update_settings({
            'jujugui.charmstore_url': '1.2.3.4/api',
            'jujugui.GTM_enabled': 'true',
            'jujugui.sandbox': 'true',
            'jujugui.auth': 'blob',
            'jujugui.user': 'who',
            'jujugui.password': 'secret',
        })
        jujugui.make_application(self.config)
        response = views.config(self.request)
        config = self.check_response(response)
        self.assertEqual('1.2.3.4/api', config['charmstoreURL'])
        self.assertTrue(config['GTM_enabled'])
        self.assertEqual('blob', config['auth'])
        # Note that here we are testing that the value is actually True or
        # False, not that it just evaluates to True/False(like in assertTrue).
        self.assertIs(True, config['sandbox'])
        # User/password values that are explitly set trump defaults.
        self.assertEqual('who', config['user'])
        self.assertEqual('secret', config['password'])

    def test_explicit_base_url(self):
        self.update_settings({'jujugui.base_url': '/ignore/prefix'})
        jujugui.make_application(self.config)
        response = views.config(self.request)
        config = self.check_response(response)
        self.assertEqual('sandbox', config['jujuEnvUUID'])
        self.assertEqual('/ignore/prefix', config['baseUrl'])

    def test_credentials(self):
        self.update_settings({
            'jujugui.user': 'dalek',
            'jujugui.password': 'exterminate!',
        })
        jujugui.make_application(self.config)
        response = views.config(self.request)
        config = self.check_response(response)
        # When sandbox mode is disabled, the real credentials are provided.
        self.assertIs(False, config['sandbox'])
        self.assertEqual('dalek', config['user'])
        self.assertEqual('exterminate!', config['password'])

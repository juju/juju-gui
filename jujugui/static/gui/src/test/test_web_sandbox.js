/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2014 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

(function() {

  describe('Web sandbox', function() {
    var mockState, utils, webSandbox, webModule, Y;
    var requirements = ['juju-env-web-sandbox', 'juju-tests-utils'];

    before(function(done) {
      // Set up the YUI instance, the test utils and the web namespace.
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        webModule = Y.namespace('juju.environments.web');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a web sandbox passing a mock state object.
      mockState = {
        getLocalCharmFileUrl: utils.makeStubFunction('file-url'),
        handleLocalCharmFileRequest: utils.makeStubFunction(),
        handleUploadLocalCharm: utils.makeStubFunction()
      };
      webSandbox = new webModule.WebSandbox({state: mockState});
    });

    afterEach(function() {
      webSandbox.destroy();
    });

    describe('sendPostRequest', function() {

      it('uses the given state to handle local charm uploads', function() {
        var path = '/juju-core/charms?series=trusty';
        var headers = {'Content-Type': 'application/zip'};
        var data = 'a zip file object';
        // Make a POST request.
        webSandbox.sendPostRequest(
            path, headers, data, 'user', 'passwd', function() {},
            function() {return 'completed';});
        // Ensure the state has been called with the expected arguments.
        assert.strictEqual(mockState.handleUploadLocalCharm.callCount(), 1);
        var lastArguments = mockState.handleUploadLocalCharm.lastArguments();
        assert.strictEqual(lastArguments.length, 3);
        var zipFile = lastArguments[0];
        var series = lastArguments[1];
        var completedCallback = lastArguments[2];
        assert.strictEqual(zipFile, data);
        assert.strictEqual(series, 'trusty');
        assert.strictEqual(completedCallback(), 'completed');
      });

      it('prints a console error if the request is not valid', function() {
        // Patch the console.error method.
        var mockError = utils.makeStubMethod(console, 'error');
        // Make a POST request to an unexpected URL.
        webSandbox.sendPostRequest(
            '/no-such-resource/', {}, 'data', 'user', 'passwd');
        mockError.reset();
        // The state object has not been used.
        assert.strictEqual(mockState.handleUploadLocalCharm.called(), false);
        // An error has been printed to the console.
        assert.strictEqual(mockError.callCount(), 1);
        var lastArguments = mockError.lastArguments();
        assert.strictEqual(lastArguments.length, 1);
        assert.strictEqual(
            'unexpected POST request to /no-such-resource/', lastArguments[0]);
      });

    });

    describe('sendGetRequest', function() {

      it('handles local charm file contents retrieval', function() {
        var path = '/juju-core/charms' +
            '?url=local:trusty/juju-gui-42&file=hooks/install';
        // Make a GET request.
        webSandbox.sendGetRequest(
            path, {}, 'user', 'passwd', function() {},
            function() {return 'completed';});
        // Ensure the state has been called with the expected arguments.
        var method = mockState.handleLocalCharmFileRequest;
        assert.strictEqual(method.callCount(), 1);
        var lastArguments = method.lastArguments();
        assert.strictEqual(lastArguments.length, 3);
        var charmUrl = lastArguments[0];
        var filename = lastArguments[1];
        var completedCallback = lastArguments[2];
        assert.strictEqual(charmUrl, 'local:trusty/juju-gui-42');
        assert.strictEqual(filename, 'hooks/install');
        assert.strictEqual(completedCallback(), 'completed');
      });

      it('handles local charm files listing', function() {
        var path = '/juju-core/charms?url=local:saucy/django-42';
        // Make a GET request.
        webSandbox.sendGetRequest(
            path, {}, 'user', 'passwd', function() {},
            function() {return 'completed';});
        // Ensure the state has been called with the expected arguments.
        var method = mockState.handleLocalCharmFileRequest;
        assert.strictEqual(method.callCount(), 1);
        var lastArguments = method.lastArguments();
        assert.strictEqual(lastArguments.length, 3);
        var charmUrl = lastArguments[0];
        var filename = lastArguments[1];
        var completedCallback = lastArguments[2];
        assert.strictEqual(charmUrl, 'local:saucy/django-42');
        assert.isUndefined(filename);
        assert.strictEqual(completedCallback(), 'completed');
      });

      it('prints a console error if the request is not valid', function() {
        // Patch the console.error method.
        var mockError = utils.makeStubMethod(console, 'error');
        // Make a GET request to an unexpected URL.
        webSandbox.sendGetRequest('/no-such-resource/', {}, 'user', 'passwd');
        mockError.reset();
        // The state object has not been used.
        assert.strictEqual(
            mockState.handleLocalCharmFileRequest.called(), false);
        // An error has been printed to the console.
        assert.strictEqual(mockError.callCount(), 1);
        var lastArguments = mockError.lastArguments();
        assert.strictEqual(lastArguments.length, 1);
        assert.strictEqual(
            'unexpected GET request to /no-such-resource/', lastArguments[0]);
      });

    });

    describe('getUrl', function() {

      it('uses the state to handle returning charm file paths', function() {
        var url = webSandbox.getUrl(
            '/juju-core/charms?url=local:trusty/django-42&file=icon.svg',
            'myuser', 'mypassword');
        assert.strictEqual(url, 'file-url');
        // Ensure the state has been called with the expected arguments.
        assert.strictEqual(mockState.getLocalCharmFileUrl.callCount(), 1);
        var lastArguments = mockState.getLocalCharmFileUrl.lastArguments();
        assert.lengthOf(lastArguments, 2);
        var charmUrl = lastArguments[0];
        var filename = lastArguments[1];
        assert.strictEqual(charmUrl, 'local:trusty/django-42');
        assert.strictEqual(filename, 'icon.svg');
      });

      it('prints a console error if the request is not valid', function() {
        // Patch the console.error method.
        var mockError = utils.makeStubMethod(console, 'error');
        // Make a POST request to an unexpected URL.
        webSandbox.getUrl('/no-such-resource/', 'myuser', 'mypassword');
        mockError.reset();
        // An error has been printed to the console.
        assert.strictEqual(mockError.callCount(), 1);
        var lastArguments = mockError.lastArguments();
        assert.lengthOf(lastArguments, 1);
        assert.strictEqual(
            'unexpected getUrl request to /no-such-resource/',
            lastArguments[0]);
      });

    });

  });

})();

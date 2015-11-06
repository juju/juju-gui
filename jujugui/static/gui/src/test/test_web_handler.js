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

  describe('Web handler', function() {
    var mockXhr, utils, webHandler, webModule, Y;
    var requirements = ['juju-env-web-handler', 'juju-tests-utils'];

    before(function(done) {
      // Set up the YUI instance, the test utils and the web namespace.
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        webModule = Y.namespace('juju.environments.web');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a web handler and set up an XMLHttpRequest mock.
      webHandler = new webModule.WebHandler();
      var context = XMLHttpRequest.prototype;
      mockXhr = {
        addEventListener: utils.makeStubMethod(context, 'addEventListener'),
        open: utils.makeStubMethod(context, 'open'),
        setRequestHeader: utils.makeStubMethod(context, 'setRequestHeader'),
        send: utils.makeStubMethod(context, 'send'),
        removeEventListener: utils.makeStubMethod(
            context, 'removeEventListener')
      };
    });

    afterEach(function() {
      webHandler.destroy();
      // Reset all the method mocks.
      Y.each(mockXhr, function(value) {
        value.reset();
      });
    });

    // Ensure the progress event is correctly handled.
    var assertProgressHandled = function(progressCallback) {
      // Retrieve the registered progress handler.
      var args = mockXhr.addEventListener.allArguments();
      var progressHandler = args[0][1];
      // Set up a progress event and call the progress handler.
      var evt = {type: 'progress'};
      progressHandler(evt);
      // The progress callback has been correctly called.
      assert.strictEqual(progressCallback.callCount(), 1);
      assert.deepEqual(progressCallback.lastArguments(), [evt]);
      // The event listeners are only removed when the completed callback is
      // called.
      assert.strictEqual(mockXhr.removeEventListener.called(), false);
    };

    // Ensure the completed event is correctly handled.
    var assertCompletedHandled = function(completedCallback) {
      // Retrieve the registered handlers.
      var args = mockXhr.addEventListener.allArguments();
      var progressHandler = args[0][1];
      var completedHandler = args[1][1];
      // Set up a load event and call the completed handler.
      var evt = {type: 'load'};
      completedHandler(evt);
      // The completion callback has been correctly called.
      assert.strictEqual(completedCallback.callCount(), 1);
      assert.deepEqual(completedCallback.lastArguments(), [evt]);
      // The event listeners have been removed.
      assert.strictEqual(mockXhr.removeEventListener.callCount(), 2);
      args = mockXhr.removeEventListener.allArguments();
      assert.deepEqual(args[0], ['progress', progressHandler]);
      assert.deepEqual(args[1], ['load', completedHandler]);
    };

    describe('sendPostRequest', function() {

      it('opens and sends an XHR request with the proper data', function() {
        var path = '/juju-core/charms?series=trusty';
        var headers = {'Content-Type': 'application/zip'};
        var data = 'a zip file object';
        // Make a POST request.
        webHandler.sendPostRequest(
            path, headers, data, 'user', 'passwd', false,
            function() {return 'progress';}, function() {return 'completed';});
        // Ensure the xhr instance has been used properly.
        assert.strictEqual(mockXhr.addEventListener.callCount(), 2);
        // Two events listeners are added, one for request's progress and one
        // for request's completion.
        var args = mockXhr.addEventListener.allArguments();
        assert.strictEqual(args[0][0], 'progress');
        assert.strictEqual(args[1][0], 'load');
        // The xhr is then asynchronously opened.
        assert.strictEqual(mockXhr.open.callCount(), 1);
        assert.deepEqual(mockXhr.open.lastArguments(), ['POST', path, true]);
        // Headers are properly set up.
        assert.strictEqual(mockXhr.setRequestHeader.callCount(), 2);
        args = mockXhr.setRequestHeader.allArguments();
        assert.deepEqual(args[0], ['Content-Type', 'application/zip']);
        assert.deepEqual(args[1], ['Authorization', 'Basic dXNlcjpwYXNzd2Q=']);
        // The zip file is then correctly sent.
        assert.strictEqual(mockXhr.send.callCount(), 1);
        assert.deepEqual(mockXhr.send.lastArguments(), ['a zip file object']);
        // The event listeners are only removed when the completed callback is
        // called.
        assert.strictEqual(mockXhr.removeEventListener.called(), false);
      });

      it('handles request progress', function() {
        var progressCallback = utils.makeStubFunction();
        // Make a POST request.
        webHandler.sendPostRequest(
            '/path/', {}, 'data', 'user', 'passwd', false, progressCallback);
        assertProgressHandled(progressCallback);
      });

      it('handles request completion', function() {
        var completedCallback = utils.makeStubFunction();
        // Make a POST request.
        webHandler.sendPostRequest(
            '/path/', {}, 'data', 'user', 'passwd', false,
            function() {}, completedCallback);
        assertCompletedHandled(completedCallback);
      });

    });

    describe('sendPutRequest', function() {

      it('opens and sends an XHR request with the proper data', function() {
        var path = '/juju-core/charms?series=trusty';
        var headers = {'Content-Type': 'application/zip'};
        var data = 'a zip file object';
        // Make a POST request.
        webHandler.sendPutRequest(
            path, headers, data, 'user', 'passwd', false,
            function() {return 'progress';}, function() {return 'completed';});
        // Ensure the xhr instance has been used properly.
        assert.strictEqual(mockXhr.addEventListener.callCount(), 2);
        // Two events listeners are added, one for request's progress and one
        // for request's completion.
        var args = mockXhr.addEventListener.allArguments();
        assert.strictEqual(args[0][0], 'progress');
        assert.strictEqual(args[1][0], 'load');
        // The xhr is then asynchronously opened.
        assert.strictEqual(mockXhr.open.callCount(), 1);
        assert.deepEqual(mockXhr.open.lastArguments(), ['PUT', path, true]);
        // Headers are properly set up.
        assert.strictEqual(mockXhr.setRequestHeader.callCount(), 2);
        args = mockXhr.setRequestHeader.allArguments();
        assert.deepEqual(args[0], ['Content-Type', 'application/zip']);
        assert.deepEqual(args[1], ['Authorization', 'Basic dXNlcjpwYXNzd2Q=']);
        // The zip file is then correctly sent.
        assert.strictEqual(mockXhr.send.callCount(), 1);
        assert.deepEqual(mockXhr.send.lastArguments(), ['a zip file object']);
        // The event listeners are only removed when the completed callback is
        // called.
        assert.strictEqual(mockXhr.removeEventListener.called(), false);
      });

      it('handles request progress', function() {
        var progressCallback = utils.makeStubFunction();
        // Make a POST request.
        webHandler.sendPostRequest(
            '/path/', {}, 'data', 'user', 'passwd', false, progressCallback);
        assertProgressHandled(progressCallback);
      });

      it('handles request completion', function() {
        var completedCallback = utils.makeStubFunction();
        // Make a POST request.
        webHandler.sendPostRequest(
            '/path/', {}, 'data', 'user', 'passwd', false,
            function() {}, completedCallback);
        assertCompletedHandled(completedCallback);
      });

    });

    describe('sendGetRequest', function() {

      it('opens and sends an XHR request with the proper data', function() {
        var path = '/juju-core/charms?url=local:trusty/django-42';
        // Make a POST request.
        webHandler.sendGetRequest(
            path, null, 'user', 'passwd', false,
            function() {return 'progress';}, function() {return 'completed';});
        // Ensure the xhr instance has been used properly.
        assert.strictEqual(mockXhr.addEventListener.callCount(), 2);
        // Two events listeners are added, one for request's progress and one
        // for request's completion.
        var args = mockXhr.addEventListener.allArguments();
        assert.strictEqual(args[0][0], 'progress');
        assert.strictEqual(args[1][0], 'load');
        // The xhr is then asynchronously opened.
        assert.strictEqual(mockXhr.open.callCount(), 1);
        assert.deepEqual(mockXhr.open.lastArguments(), ['GET', path, true]);
        // Headers are properly set up.
        assert.strictEqual(mockXhr.setRequestHeader.callCount(), 1);
        args = mockXhr.setRequestHeader.allArguments();
        assert.deepEqual(args[0], ['Authorization', 'Basic dXNlcjpwYXNzd2Q=']);
        // The zip file is then correctly sent.
        assert.strictEqual(mockXhr.send.callCount(), 1);
        assert.lengthOf(mockXhr.send.lastArguments(), 0);
        // The event listeners are only removed when the completed callback is
        // called.
        assert.strictEqual(mockXhr.removeEventListener.called(), false);
      });

      it('handles request progress', function() {
        var progressCallback = utils.makeStubFunction();
        // Make a GET request.
        webHandler.sendGetRequest(
            '/path/', {}, 'user', 'passwd', false, progressCallback);
        assertProgressHandled(progressCallback);
      });

      it('handles request completion', function() {
        var completedCallback = utils.makeStubFunction();
        // Make a GET request.
        webHandler.sendGetRequest(
            '/path/', {}, 'user', 'passwd', false,
            function() {}, completedCallback);
        assertCompletedHandled(completedCallback);
      });

    });

    it('defines a function which helps creating auth headers', function() {
      var header = webHandler._createAuthorizationHeader('myuser', 'mypasswd');
      assert.strictEqual(header, 'Basic bXl1c2VyOm15cGFzc3dk');
    });

    describe('getUrl', function() {
      it('returns a complete URL based on the given credentials', function() {
        var url = webHandler.getUrl('/my/path', 'myuser', 'mypassword');
        var expectedUrl = 'http://myuser:mypassword@' +
            window.location.host + '/my/path';
        assert.strictEqual(url, expectedUrl);
      });
    });

  });

})();

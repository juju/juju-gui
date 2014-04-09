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

    it('opens and sends an XHR request with the proper data', function() {
      var url = '/juju-core/charms?series=trusty';
      var headers = {'Content-Type': 'application/zip'};
      var data = 'a zip file object';
      // Make a POST request.
      webHandler.post(
          url, headers, data, 'user', 'passwd',
          function() {return 'progress';}, function() {return 'completed';});
      // Ensure the xhr instance has been used properly.
      assert.strictEqual(mockXhr.addEventListener.callCount(), 2);
      // Two events listeners are added, one for request's progress and one for
      // request's completion. The same event handler is used for both, and
      // then stored in the webHandler instance so that subscribers can be
      // removed later, when the request/response process completes.
      var args = mockXhr.addEventListener.allArguments();
      var eventHandler = webHandler.get('xhrEventHandler');
      assert.deepEqual(args[0], ['progress', eventHandler, false]);
      assert.deepEqual(args[1], ['load', eventHandler, false]);
      // The xhr is then asynchronously opened.
      assert.strictEqual(mockXhr.open.callCount(), 1);
      assert.deepEqual(mockXhr.open.lastArguments(), ['POST', url, true]);
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
      webHandler.post('/url/', {}, 'data', 'user', 'passwd', progressCallback);
      var eventHandler = webHandler.get('xhrEventHandler');
      // Set up a progress event.
      var evt = {type: 'progress'};
      eventHandler(evt);
      // The progress callback has been correctly called.
      assert.strictEqual(progressCallback.callCount(), 1);
      assert.deepEqual(progressCallback.lastArguments(), [evt]);
    });

    it('handles request completion', function() {
      var completedCallback = utils.makeStubFunction();
      // Make a POST request.
      webHandler.post(
          '/url/', {}, 'data', 'user', 'passwd',
          function() {}, completedCallback);
      var eventHandler = webHandler.get('xhrEventHandler');
      // Set up a progress event.
      var evt = {type: 'load'};
      eventHandler(evt);
      // The completion callback has been correctly called.
      assert.strictEqual(completedCallback.callCount(), 1);
      assert.deepEqual(completedCallback.lastArguments(), [evt]);
      // The event listeners have been removed.
      assert.strictEqual(mockXhr.removeEventListener.callCount(), 2);
      var args = mockXhr.removeEventListener.allArguments();
      assert.deepEqual(args[0], ['progress', eventHandler]);
      assert.deepEqual(args[1], ['load', eventHandler]);
    });

    it('defines a function which helps creating auth headers', function() {
      var header = webHandler._createAuthorizationHeader('myuser', 'mypasswd');
      assert.strictEqual(header, 'Basic bXl1c2VyOm15cGFzc3dk');
    });

    it('returns a complete URL based on the given credentials', function() {
      var url = webHandler.getUrl('/my/path', 'myuser', 'mypassword');
      var expectedUrl = 'http://myuser:mypassword@' +
          window.location.host + '/my/path';
      assert.strictEqual(url, expectedUrl);
    });

  });

})();

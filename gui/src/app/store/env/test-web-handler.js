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

const WebHandler = require('./web-handler');

(function() {
  describe('Web handler', function() {
    let mockXhr, webHandler;

    beforeEach(function() {
      // Instantiate a web handler and set up an XMLHttpRequest mock.
      webHandler = new WebHandler();
      const context = XMLHttpRequest.prototype;
      mockXhr = {
        addEventListener: sinon.stub(context, 'addEventListener'),
        open: sinon.stub(context, 'open'),
        setRequestHeader: sinon.stub(context, 'setRequestHeader'),
        send: sinon.stub(context, 'send'),
        removeEventListener: sinon.stub(
          context, 'removeEventListener')
      };
    });

    afterEach(function() {
      // Reset all the method mocks.
      Object.keys(mockXhr).forEach(key => {
        mockXhr[key].restore();
      });
    });

    // Ensure the progress event is correctly handled.
    const assertProgressHandled = function(progressCallback) {
      // Retrieve the registered progress handler.
      let args = mockXhr.addEventListener.args;
      const progressHandler = args[0][1];
      // Set up a progress event and call the progress handler.
      const evt = {type: 'progress'};
      progressHandler(evt);
      // The progress callback has been correctly called.
      assert.strictEqual(progressCallback.callCount, 1);
      assert.deepEqual(progressCallback.lastCall.args, [evt]);
      // The event listeners are only removed when the completed callback is
      // called.
      assert.strictEqual(mockXhr.removeEventListener.called, false);
    };

    // Ensure the completed event is correctly handled.
    const assertCompletedHandled = function(completedCallback) {
      // Retrieve the registered handlers.
      let args = mockXhr.addEventListener.args;
      const progressHandler = args[0][1];
      const completedHandler = args[1][1];
      // Set up a load event and call the completed handler.
      const evt = {type: 'load'};
      completedHandler(evt);
      // The completion callback has been correctly called.
      assert.strictEqual(completedCallback.callCount, 1);
      assert.deepEqual(completedCallback.lastCall.args, [evt]);
      // The event listeners have been removed.
      assert.strictEqual(mockXhr.removeEventListener.callCount, 3);
      args = mockXhr.removeEventListener.args;
      assert.deepEqual(args[0], ['progress', progressHandler]);
      assert.deepEqual(args[1], ['error', completedHandler]);
      assert.deepEqual(args[2], ['load', completedHandler]);
    };

    describe('sendPostRequest', function() {
      it('opens and sends an XHR request with the proper data', function() {
        const path = '/juju-core/charms?series=trusty';
        const headers = {'Content-Type': 'application/zip'};
        const data = 'a zip file object';
        // Make a POST request.
        webHandler.sendPostRequest(
          path, headers, data, 'user', 'passwd', false,
          function() {return 'progress';}, function() {return 'completed';});
        // Ensure the xhr instance has been used properly.
        assert.strictEqual(mockXhr.addEventListener.callCount, 3);
        // Two events listeners are added, one for request's progress and one
        // for request's completion.
        let args = mockXhr.addEventListener.args;
        assert.strictEqual(args[0][0], 'progress');
        assert.strictEqual(args[1][0], 'error');
        assert.strictEqual(args[2][0], 'load');
        // The xhr is then asynchronously opened.
        assert.strictEqual(mockXhr.open.callCount, 1);
        assert.deepEqual(mockXhr.open.lastCall.args, ['POST', path, true]);
        // Headers are properly set up.
        assert.strictEqual(mockXhr.setRequestHeader.callCount, 2);
        args = mockXhr.setRequestHeader.args;
        assert.deepEqual(args[0], ['Content-Type', 'application/zip']);
        assert.deepEqual(args[1], ['Authorization', 'Basic dXNlcjpwYXNzd2Q=']);
        // The zip file is then correctly sent.
        assert.strictEqual(mockXhr.send.callCount, 1);
        assert.deepEqual(mockXhr.send.lastCall.args, ['a zip file object']);
        // The event listeners are only removed when the completed callback is
        // called.
        assert.strictEqual(mockXhr.removeEventListener.called, false);
      });

      it('handles request progress', function() {
        const progressCallback = sinon.stub();
        // Make a POST request.
        webHandler.sendPostRequest(
          '/path/', {}, 'data', 'user', 'passwd', false, progressCallback);
        assertProgressHandled(progressCallback);
      });

      it('handles request completion', function() {
        const completedCallback = sinon.stub();
        // Make a POST request.
        webHandler.sendPostRequest(
          '/path/', {}, 'data', 'user', 'passwd', false,
          function() {}, completedCallback);
        assertCompletedHandled(completedCallback);
      });

    });

    describe('sendPutRequest', function() {
      it('opens and sends an XHR request with the proper data', function() {
        const path = '/juju-core/charms?series=trusty';
        const headers = {'Content-Type': 'application/zip'};
        const data = 'a zip file object';
        // Make a POST request.
        webHandler.sendPutRequest(
          path, headers, data, 'user', 'passwd', false,
          function() {return 'progress';}, function() {return 'completed';});
        // Ensure the xhr instance has been used properly.
        assert.strictEqual(mockXhr.addEventListener.callCount, 3);
        // Two events listeners are added, one for request's progress and one
        // for request's completion.
        let args = mockXhr.addEventListener.args;
        assert.strictEqual(args[0][0], 'progress');
        assert.strictEqual(args[1][0], 'error');
        assert.strictEqual(args[2][0], 'load');
        // The xhr is then asynchronously opened.
        assert.strictEqual(mockXhr.open.callCount, 1);
        assert.deepEqual(mockXhr.open.lastCall.args, ['PUT', path, true]);
        // Headers are properly set up.
        assert.strictEqual(mockXhr.setRequestHeader.callCount, 2);
        args = mockXhr.setRequestHeader.args;
        assert.deepEqual(args[0], ['Content-Type', 'application/zip']);
        assert.deepEqual(args[1], ['Authorization', 'Basic dXNlcjpwYXNzd2Q=']);
        // The zip file is then correctly sent.
        assert.strictEqual(mockXhr.send.callCount, 1);
        assert.deepEqual(mockXhr.send.lastCall.args, ['a zip file object']);
        // The event listeners are only removed when the completed callback is
        // called.
        assert.strictEqual(mockXhr.removeEventListener.called, false);
      });

      it('handles request progress', function() {
        const progressCallback = sinon.stub();
        // Make a POST request.
        webHandler.sendPutRequest(
          '/path/', {}, 'data', 'user', 'passwd', false, progressCallback);
        assertProgressHandled(progressCallback);
      });

      it('handles request completion', function() {
        const completedCallback = sinon.stub();
        // Make a POST request.
        webHandler.sendPutRequest(
          '/path/', {}, 'data', 'user', 'passwd', false,
          function() {}, completedCallback);
        assertCompletedHandled(completedCallback);
      });

    });

    describe('sendGetRequest', function() {

      it('opens and sends an XHR request with the proper data', function() {
        const path = '/juju-core/charms?url=local:trusty/django-42';
        // Make a GET request.
        webHandler.sendGetRequest(
          path, null, 'user', 'passwd', false,
          function() {return 'progress';}, function() {return 'completed';});
        // Ensure the xhr instance has been used properly.
        assert.strictEqual(mockXhr.addEventListener.callCount, 3);
        // Two events listeners are added, one for request's progress and one
        // for request's completion.
        let args = mockXhr.addEventListener.args;
        assert.strictEqual(args[0][0], 'progress');
        assert.strictEqual(args[1][0], 'error');
        assert.strictEqual(args[2][0], 'load');
        // The xhr is then asynchronously opened.
        assert.strictEqual(mockXhr.open.callCount, 1);
        assert.deepEqual(mockXhr.open.lastCall.args, ['GET', path, true]);
        // Headers are properly set up.
        assert.strictEqual(mockXhr.setRequestHeader.callCount, 1);
        args = mockXhr.setRequestHeader.args;
        assert.deepEqual(args[0], ['Authorization', 'Basic dXNlcjpwYXNzd2Q=']);
        // The zip file is then correctly sent.
        assert.strictEqual(mockXhr.send.callCount, 1);
        assert.lengthOf(mockXhr.send.lastCall.args, 0);
        // The event listeners are only removed when the completed callback is
        // called.
        assert.strictEqual(mockXhr.removeEventListener.called, false);
      });

      it('handles request progress', function() {
        const progressCallback = sinon.stub();
        // Make a GET request.
        webHandler.sendGetRequest(
          '/path/', {}, 'user', 'passwd', false, progressCallback);
        assertProgressHandled(progressCallback);
      });

      it('handles request completion', function() {
        const completedCallback = sinon.stub();
        // Make a GET request.
        webHandler.sendGetRequest(
          '/path/', {}, 'user', 'passwd', false,
          function() {}, completedCallback);
        assertCompletedHandled(completedCallback);
      });

    });

    describe('sendPatchRequest', function() {

      it('opens and sends an XHR request with the proper data', function() {
        const path = '/juju-core/charms?series=trusty';
        const headers = {'Content-Type': 'application/zip'};
        const data = 'a zip file object';
        // Make a PATCH request.
        webHandler.sendPatchRequest(
          path, headers, data, 'user', 'passwd', false,
          function() {return 'progress';}, function() {return 'completed';});
        // Ensure the xhr instance has been used properly.
        assert.strictEqual(mockXhr.addEventListener.callCount, 3);
        // Two events listeners are added, one for request's progress and one
        // for request's completion.
        let args = mockXhr.addEventListener.args;
        assert.strictEqual(args[0][0], 'progress');
        assert.strictEqual(args[1][0], 'error');
        assert.strictEqual(args[2][0], 'load');
        // The xhr is then asynchronously opened.
        assert.strictEqual(mockXhr.open.callCount, 1);
        assert.deepEqual(mockXhr.open.lastCall.args, ['PATCH', path, true]);
        // Headers are properly set up.
        assert.strictEqual(mockXhr.setRequestHeader.callCount, 2);
        args = mockXhr.setRequestHeader.args;
        assert.deepEqual(args[0], ['Content-Type', 'application/zip']);
        assert.deepEqual(args[1], ['Authorization', 'Basic dXNlcjpwYXNzd2Q=']);
        // The zip file is then correctly sent.
        assert.strictEqual(mockXhr.send.callCount, 1);
        assert.deepEqual(mockXhr.send.lastCall.args, ['a zip file object']);
        // The event listeners are only removed when the completed callback is
        // called.
        assert.strictEqual(mockXhr.removeEventListener.called, false);
      });

      it('handles request progress', function() {
        const progressCallback = sinon.stub();
        // Make a PATCH request.
        webHandler.sendPatchRequest(
          '/path/', {}, 'data', 'user', 'passwd', false, progressCallback);
        assertProgressHandled(progressCallback);
      });

      it('handles request completion', function() {
        const completedCallback = sinon.stub();
        // Make a PATCH request.
        webHandler.sendPatchRequest(
          '/path/', {}, 'data', 'user', 'passwd', false,
          function() {}, completedCallback);
        assertCompletedHandled(completedCallback);
      });
    });

    it('defines a function which helps creating auth headers', function() {
      const header = webHandler._createAuthorizationHeader('myuser', 'mypasswd');
      assert.strictEqual(header, 'Basic bXl1c2VyOm15cGFzc3dk');
    });

    describe('getUrl', function() {
      it('returns a complete URL based on the given credentials', function() {
        const url = webHandler.getUrl('/my/path', 'myuser', 'mypassword');
        const expectedUrl = 'http://myuser:mypassword@' +
            window.location.host + '/my/path';
        assert.strictEqual(url, expectedUrl);
      });
    });
  });
})();

/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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
// Test utils.

YUI(GlobalConfig).add('juju-tests-utils', function(Y) {
  var jujuTests = Y.namespace('juju-tests');

  jujuTests.utils = {
    /**
     * Make a stub method.  Pass in 0 or more arguments to become responses
     * that the method cycles through.
     *
     * The function has all introspection methods from makeMockFunction,
     * plus "reset", which resets the object with the original value.
     * This is pre-bound, so it is easy to pass in as a clean-up function.
     *
     * @method makeStubMethod
     * @param {Object} context the object on which the method will sit.
     * @param {String} name the name to be replaced.
     * @return {Function} the new stub function.
     */
    makeStubMethod: function(context, name, args) {
      const responses = Array.prototype.slice.call(arguments, 2);
      const mockMethod = sinon.stub();
      if (responses.length === 1) {
        // If only one reponse is supplied then return that every time the
        // method is called.
        mockMethod.returns(responses[0]);
      } else {
        responses.forEach((response, i) => {
          mockMethod.onCall(i).returns(response);
        });
      }
      const original = context[name];
      context[name] = mockMethod;
      mockMethod.reset = function() {
        context[name] = original;
      };
      mockMethod.passThroughToOriginalMethod = function(instance) {
        if (!Y.Lang.isValue(instance)) {
          instance = context;
        }
        return original.apply(instance, mockMethod.lastCall.args);
      };
      return mockMethod;
    },

    makeContainer: function(ctx, id, visibleContainer) {
      // You must pass a context and it must be a valid object.
      if (arguments.length < 1) {
        throw (
            'makeContainer requires a context in order to track containers' +
            'to cleanup.');
      }

      if (typeof ctx !== 'object') {
        throw (
            'makeContainer requires a context in order to track containers' +
            'to cleanup.');
      }

      var container = Y.Node.create('<div>');
      if (id) {
        container.set('id', id);
      }
      container.appendTo(document.body);
      if (visibleContainer !== false) {
        container.setStyle('position', 'absolute');
        container.setStyle('top', '-10000px');
        container.setStyle('left', '-10000px');
      }

      // Add the destroy ability to the test hook context to be run on
      // afterEach automatically.
      ctx._cleanups.push(function() {
        container.remove(true);
        container.destroy();
      });

      return container;
    },

    /**
      Create and return a container suitable for rendering the whole app.

      Callers are responsible of removing the container from the document when
      done.

      @method makeAppContainer
      @param {Object} yui The YUI instance.
      @return {Object} The container element, already attached to the window
        document.
    */
    makeAppContainer: (yui) => {
      const elements = [
        'charmbrowser-container',
        'deployment-bar-container',
        'deployment-container',
        'drag-over-notification-container',
        'env-size-display-container',
        'full-screen-mask',
        'header-breadcrumb',
        'header-search-container',
        'import-export-container',
        'inspector-container',
        'loading-message',
        'login-container',
        'machine-view',
        'notifications-container',
        'profile-link-container',
        'top-page-container',
        'zoom-container'
      ];
      const container = yui.Node.create('<div>');
      container.set('id', 'test-container');
      container.addClass('container');
      elements.forEach(function(id) {
        container.appendChild(yui.Node.create('<div/>')).set('id', id);
      });
      container.appendTo(document.body);
      return container;
    },

    SocketStub: function() {
      // The readyState needs to be defined because we check for its value
      // before sending any requests to avoid errors.
      this.readyState = 1;

      this.messages = [];

      this.close = function() {
        this.messages = [];
      };

      this.transient_close = function() {
        this.onclose();
      };

      this.open = function() {
        this.onopen();
        return this;
      };

      this.msg = function(m) {
        this.onmessage({'data': Y.JSON.stringify(m)});
      };

      this.last_message = function(back) {
        if (!back) {
          back = 1;
        }
        return this.messages[this.messages.length - back];
      };

      this.send = function(m) {
        this.messages.push(Y.JSON.parse(m));
      };

      this.onclose = function() {};
      this.onmessage = function() {};
      this.onopen = function() {};

    },

    getter: function(attributes, default_) {
      return function(name) {
        if (attributes.hasOwnProperty(name)) {
          return attributes[name];
        } else {
          return default_;
        }
      };
    },

    setter: function(attributes) {
      return function(name, value) {
        attributes[name] = value;
      };
    },

    /**
     * Util to load a fixture (typically as 'data/filename.json').
     *
     * @method loadFixture
     * @param {String} url to synchronously load, appended /test/ base url.
     * @param {Boolean} parseJSON when true return will be processed
     *                  as a JSON blob before returning.
     * @return {Object} fixture data resulting from call.
     */
    loadFixture: function(url, parseJson) {
      var tries = 3;
      var response;
      url = GlobalConfig.test_url + url;
      while (true) {
        try {
          response = Y.io(url, {sync: true}).responseText;
          if (parseJson) {
            response = Y.JSON.parse(response);
          }
          break;
        } catch (e) {
          tries -= 1;
          if (tries <= 0) {
            throw e;
          }
        }
      }
      return response;
    }
  };

}, '0.1.0', {
  requires: [
    'io',
    'node',
    'promise',
    'json-parse',
    'datasource-local',
    'juju-env-fakebackend'
  ]
});

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

  // Simple key value store of data for running tests to avoid
  // performing multiple requests over the wire.
  jujuTests.dataStore = {};

  jujuTests.utils = {

    /**
     * Make a stub function.  Pass in 0 or more arguments to become responses
     * that the function cycles through.
     *
     * @method makeStubFunction
     * @return {Function} the new stub function.
     */
    makeStubFunction: function() {
      var responses = Array.prototype.slice.call(arguments, 0);
      if (responses.length === 0) {
        responses.push(undefined);
      }
      var f = function() {
        var response = responses[(f._allArguments.length) % responses.length];
        f._allArguments.push(Array.prototype.slice.call(arguments, 0));
        f._callbacks.forEach(function(cb) {cb.call(f);});
        return response;
      };
      f._allArguments = [];
      f._callbacks = [];
      f.called = function() {
        return !!f._allArguments.length;
      };
      f.calledOnce = function() {
        return f._allArguments.length === 1;
      };
      f.callCount = function() {
        return f._allArguments.length;
      };
      f.lastArguments = function() {
        return f._allArguments[f._allArguments.length - 1];
      };
      f.allArguments = function() {
        return f._allArguments.slice(0);
      };
      f.addCallback = function(cb) {
        f._callbacks.push(cb);
      };
      return f;
    },

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
    makeStubMethod: function(context, name) {
      var responses = Array.prototype.slice.call(arguments, 2);
      var original = context[name];
      var f = context[name] = jujuTests.utils.makeStubFunction.apply(
          jujuTests.utils, responses);
      f.reset = function() {
        context[name] = original;
      };
      f.passThroughToOriginalMethod = function(instance) {
        if (!Y.Lang.isValue(instance)) {
          instance = context;
        }
        return original.apply(instance, f.lastArguments());
      };
      return f;
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

    SocketStub: function() {
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
      // If we have already requested this data.
      if (jujuTests.dataStore[url] && parseJson) {
        return Y.clone(jujuTests.dataStore[url]);
      }
      if (jujuTests.dataStore[url + '-raw'] && !parseJson) {
        return jujuTests.dataStore[url + '-raw'];
      }
      while (true) {
        try {
          response = Y.io(url, {sync: true}).responseText;
          if (parseJson) {
            response = Y.JSON.parse(response);
            jujuTests.dataStore[url] = Y.clone(response);
          } else {
            jujuTests.dataStore[url + '-raw'] = response;
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
    },

    stubCharmIconPath: function(yui) {
      var helperNS = yui.namespace('Handlebars.helpers');
      yui.Handlebars.registerHelper(
          'charmIconPath',
          function(charmID, file) {
            return '/path/to/charm/' + file;
          });

      // Return a cleanup function to undo this change.
      return function() {
        helperNS.charmIconPath = undefined;
      };
    }
  };

  // Split jujuTests.utils definition, so that charms can be cached
  // right away, while at the same time reusing the loadFixture method.
  Y.mix(jujuTests.utils, {
    /**
     Return a promise to return a working fakebackend
     with imported YAML as its bundle. This returns
     the result of the import call as 'result' and
     the new fakebackend as 'backend'.

     promiseImport('data/bundle.yaml', 'bundleName')
     .then(function(resolve) {
      var fakebackend = resolve.backend;
      var result = resolve.result;
      // Asserts.
      done();
     })

      @method promiseImport
      @param {String} YAMLBundleURL File to import based on root path /test/.
      @param {String} [name] Name of bundle to load, optional when
             only one target in the bundle.
      @param {Object} fakebackend An instance of fakebackend from the
              factory makeFakeBackend() method.
      @return {Promise} Outlined in description.
    */
    promiseImport: function(YAMLBundleURL, name, fakebackend) {
      var db = fakebackend.db;
      db.environment.set('defaultSeries', 'precise');
      var fixture = jujuTests.utils.loadFixture(YAMLBundleURL);
      return fakebackend.promiseImport(fixture, name)
             .then(function(result) {
               return {result: result, backend: fakebackend};
             });
    },

    /**
      Renders a viewlet into the specified container passing through all
      additional options to the viewlet.

      Requires the 'juju-viewlet-manager' module.

      @method renderViewlet
      @param {Object} View A reference to the view to render.
      @param {Object} model The object to use as the model.
      @param {Object} container The container to render the viewlet into.
      @param {Object} options Any additional options you want to pass into the
        viewler manager instance.
      @param {Object} yui The YUI instance in the test suite.
      @return {Object} The new viewlet manager instance.
    */
    renderViewlet: function(View, model, container, options, yui) {
      container.append('<div class="juju-inspector"></div>');
      var viewletManager = new yui.juju.viewlets.ViewletManager(yui.mix({
        enableDatabinding: true,
        views: [new View()],
        container: container,
        viewletContainer: '.viewlet-manager',
        model: model,
        template: '<div class="viewlet-manager"></div>'
      }, options, true, null, 0, true));

      viewletManager.render();
      return viewletManager;
    }

  });
}, '0.1.0', {
  requires: [
    'handlebars',
    'io',
    'node',
    'promise',
    'json-parse',
    'datasource-local',
    'juju-env-fakebackend'
  ]
});

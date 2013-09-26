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

    makeContainer: function(id) {
      var container = Y.Node.create('<div>');
      if (id) {
        container.set('id', id);
      }
      container.appendTo(document.body);
      container.setStyle('position', 'absolute');
      container.setStyle('top', '-10000px');
      container.setStyle('left', '-10000px');
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
     * @param {String} url to synchronously load.
     * @param {Boolean} parseJSON when true return will be processed
     *                  as a JSON blob before returning.
     * @return {Object} fixture data resulting from call.
     */
    loadFixture: function(url, parseJson) {
      var response = Y.io(url, {sync: true}).responseText;
      if (parseJson) {
        response = Y.JSON.parse(response);
      }
      return response;
    },

    stubCharmIconPath: function() {
      var helperNS = Y.namespace('Handlebars.helpers');
      Y.Handlebars.registerHelper(
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

    _cached_charms: (function() {
      var url, charms = {},
          names = [
            'wordpress', 'mysql', 'puppet', 'haproxy', 'mediawiki', 'hadoop',
            'memcached', 'puppetmaster'];
      Y.Array.each(names, function(name) {
        url = 'data/' + name + '-api-response.json';
        charms[name] = jujuTests.utils.loadFixture(url, true);
      });
      return charms;
    })(),

    makeFakeStore: function(version) {
      var fakeStore;
      if (version === 3) {
        fakeStore = new Y.juju.charmworld.APIv3({});
      } else {
        fakeStore = new Y.juju.charmworld.APIv2({});
      }
      fakeStore.charm = function(store_id, callbacks, bindscope, cache) {
        store_id = this.apiHelper.normalizeCharmId(store_id, 'precise');
        var charmName = store_id.split('/')[1];
        charmName = charmName.split('-', 1);
        if (Y.Lang.isArray(charmName)) {
          charmName = charmName[0];
        }
        if (charmName in jujuTests.utils._cached_charms) {
          var response = jujuTests.utils._cached_charms[charmName];
          if (cache) {
            cache.add(response.charm);
          }
          callbacks.success(response);
        } else {
          callbacks.failure(new Error('Unable to load charm ' + charmName));
        }
      };
      return fakeStore;
    },

    makeFakeBackend: function() {
      var fakeStore = this.makeFakeStore();
      var fakebackend = new Y.juju.environments.FakeBackend({
        store: fakeStore
      });
      fakebackend.login('admin', 'password');
      return fakebackend;
    },

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
      @param {String} YAMLBundleURL File to import.
      @param {String} [name] Name of bundle to load, optional when
             only one target in the bundle.
      @return {Promise} Outlined in description.
    */
    promiseImport: function(YAMLBundleURL, name) {
      var fakebackend = this.makeFakeBackend();
      var db = fakebackend.db;
      db.environment.set('defaultSeries', 'precise');
      var fixture = jujuTests.utils.loadFixture(YAMLBundleURL);
      return fakebackend.promiseImport(fixture, name)
             .then(function(result) {
               return {result: result, backend: fakebackend};
             });
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
    'juju-charm-store',
    'juju-env-fakebackend'
  ]
});

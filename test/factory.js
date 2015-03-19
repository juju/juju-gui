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

YUI(GlobalConfig).add('juju-tests-factory', function(Y) {
  var tests = Y.namespace('juju-tests');

  var _cached_charms = (function() {
    var url,
        charms = {},
        names = [
          'wordpress', 'mysql', 'puppet', 'haproxy', 'mediawiki', 'hadoop',
          'memcached', 'puppetmaster', 'mongodb'
        ];
    Y.Array.each(names, function(name) {
      url = 'data/' + name + '-api-response.json';
      charms[name] = tests.utils.loadFixture(url, true);
    });
    return charms;
  })();

  tests.factory = {

    makeFakeStore: function() {
      var fakeStore = new Y.juju.charmworld.APIv3({});
      fakeStore.charm = function(store_id, callbacks, bindscope, cache) {
        store_id = this.apiHelper.normalizeCharmId(store_id, 'precise');
        var charmName = store_id.split('/')[1];
        charmName = charmName.split('-', 1);
        if (Y.Lang.isArray(charmName)) {
          charmName = charmName[0];
        }
        if (charmName in _cached_charms) {
          var response = _cached_charms[charmName];
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

    _fetchCharmData: function() {
      var names = [
        'wordpress', 'mongodb', 'mysql', 'mediawiki', 'puppet', 'haproxy',
        'puppetmaster'];
      var charms = {};
      names.forEach(function(charmName) {
        var url = 'data/' + charmName + '-apiv4-response.json';
        charms[charmName] = Y.io(url, {sync: true}).responseText;
      });
      return charms;
    },

    makeFakeCharmstore: function() {
      var charms = this._fetchCharmData();
      var fakeCharmstore = new Y.juju.charmstore.APIv4({
        charmstoreURL: 'local/'
      });
      // We need to stub out the _makeRequest method so that we can simulate
      // api responses from the server.
      fakeCharmstore._makeRequest = function(path, success, failure) {
        // Remove the includes and the charmstore path.
        path = path.split('/meta/any')[0].replace('local/v4/', '');
        // Get just the charm name
        path = path.split('/')[1].split('-').slice(0, -1).join('-');
        console.log(path);
        if (charms[path]) {
          success({ target: { responseText: charms[path]}});
        } else {
          failure(new Error('Unable to load charm ' + path));
        }
      };
      return fakeCharmstore;
    },

    makeFakeBackend: function() {
      var fakeStore = this.makeFakeStore();
      var fakebackend = new Y.juju.environments.FakeBackend({
        store: fakeStore,
        charmstore: this.makeFakeCharmstore()
      });
      fakebackend.login('user-admin', 'password');
      return fakebackend;
    }

  };

}, '0.1.0', {
  requires: [
    'juju-tests-utils',
    'charmstore-api'
  ]
});

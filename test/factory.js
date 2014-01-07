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
          'memcached', 'puppetmaster'
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

    makeFakeBackend: function() {
      var fakeStore = this.makeFakeStore();
      var fakebackend = new Y.juju.environments.FakeBackend({
        store: fakeStore
      });
      fakebackend.login('admin', 'password');
      return fakebackend;
    }

  };

}, '0.1.0', {
  requires: [
    'juju-tests-utils'
  ]
});

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

  tests.factory = {

    /**
      Fetches the apiv4 response data for the available charms to be used in
      the tests. Many different tests use different charms and charm data
      for testing. This fetches the api response json flat file contents and
      then stores it in a key'd object.

      @method _fetchCharmData
      @return {Object} An object containing all of the available charm data.
    */
    _fetchCharmData: function() {
      var names = [
        'wordpress', 'mongodb', 'mysql', 'mediawiki', 'puppet', 'haproxy',
        'puppetmaster', 'hadoop'];
      var charms = {};
      names.forEach(function(charmName) {
        var url = 'data/' + charmName + '-apiv4-response.json';
        charms[charmName] = Y.io(url, {sync: true}).responseText;
      });
      return charms;
    },

    makeFakeCharmstore: function() {
      var charms = this._fetchCharmData();
      var processEntity = function(entity) {
        if (entity.entityType === 'charm') {
          return new Y.juju.models.Charm(entity);
        } else {
          return new Y.juju.models.Bundle(entity);
        }
      };
      var fakeCharmstore = new window.jujulib.charmstore(
          'local/', 'v4', {}, processEntity);
      // We need to stub out the _makeRequest method so that we can simulate
      // api responses from the server.
      fakeCharmstore._makeRequest = function(path, success, failure) {
        // Remove the includes and the charmstore path.
        path = path.split('/meta/any')[0].replace('local/v4/', '');
        // Get just the charm name
        path = path.split('/')[1].split('-');
        if (path.length > 1) {
          path = path.slice(0, -1);
        }
        path = path.join('-');
        if (charms[path]) {
          success({ target: { responseText: charms[path]}});
        } else {
          failure(new Error('Unable to load charm ' + path));
        }
      };
      return fakeCharmstore;
    },

    makeFakeBackend: function() {
      var fakebackend = new Y.juju.environments.FakeBackend({
        charmstore: this.makeFakeCharmstore()
      });
      fakebackend.login('user-admin', 'password');
      return fakebackend;
    }

  };

}, '0.1.0', {
  requires: [
    'charmstore-api',
    'juju-tests-utils'
  ]
});

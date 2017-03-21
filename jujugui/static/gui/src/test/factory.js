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
      var fakeBakery = {
        sendGetRequest: function(path, success, failure) {
          // Remove the includes and the charmstore path.
          path = path.split('/meta/any')[0].replace('local/v5/', '');
          // Get just the charm name
          var pathParts = path.split('/');
          // The path might not contain the series.
          path = pathParts[1] ? pathParts[1].split('-')[0] : pathParts[0];
          var xhr = { target: { responseText: null}};
          if (charms[path]) {
            xhr.target.responseText = charms[path];
            success(xhr);
          } else {
            xhr.target.responseText = JSON.stringify(
                {message: 'Unable to load charm ' + path});
            failure(xhr);
          }
        }
      };
      var fakeCharmstore = new window.jujulib.charmstore('local/', fakeBakery);
      // We need to stub out the _makeRequest method so that we can simulate
      // api responses from the server.
      return fakeCharmstore;
    }

  };

}, '0.1.0', {
  requires: [
    'charmstore-api',
    'juju-tests-utils'
  ]
});

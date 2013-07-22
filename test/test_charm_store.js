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

(function() {

  describe('juju charm store', function() {
    var Y, models, conn, env, app, container, charmStore, data, juju;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'datasource-local', 'json-stringify', 'juju-charm-store',
          'datasource-io', 'io', 'array-extras', 'juju-charm-models',
          function(Y) {
            juju = Y.namespace('juju');
            models = Y.namespace('juju.models');
            done();
          });
    });

    beforeEach(function() {
      data = [];
      charmStore = new juju.CharmStore(
          {datasource: new Y.DataSource.Local({source: data})});
    });

    afterEach(function() {});

    it('creates a remote datasource if you simply supply a uri', function() {
      charmStore.set('datasource', 'http://example.com/');
      var datasource = charmStore.get('datasource');
      assert(datasource instanceof Y.DataSource.IO);
      datasource.get('source').should.equal('http://example.com/');
    });
  });

  describe('juju Charmworld2 api', function() {
    var Y, models, conn, env, app, container, charmStore, data, juju;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'datasource-local', 'json-stringify', 'juju-charm-store',
          'datasource-io', 'io', 'array-extras', 'juju-charm-models',
          function(Y) {
            juju = Y.namespace('juju');
            models = Y.namespace('juju.models');
            done();
          });
    });

    beforeEach(function() {
    });

    it('constructs the api url correctly based on apiHost', function() {
      var hostname = 'http://localhost/',
          api = new Y.juju.Charmworld2({
            apiHost: hostname
          }),
          ds = api.get('datasource');

      ds.get('source').should.eql('http://localhost/api/2/');

      // And it should work without a trailing / as well.
      hostname = 'http://localhost';
      api = new Y.juju.Charmworld2({
        apiHost: hostname
      });
      ds = api.get('datasource');
      ds.get('source').should.eql('http://localhost/api/2/');

    });

    it('handles loading interesting content correctly', function(done) {
      var hostname = 'http://localhost',
          api = new Y.juju.Charmworld2({
            apiHost: hostname
          }),
          data = [];

      data.push({
        responseText: Y.JSON.stringify({
          summary: 'wowza'
        })
      });
      api.set('datasource', new Y.DataSource.Local({source: data}));

      var sidebar = api.interesting({
        success: function(data) {
          data.summary.should.equal('wowza');
          done();
        },
        failure: function(data, request) {
        }
      }, this);

    });

    it('handles searching correctly', function(done) {
      var hostname = 'http://localhost',
          data = [],
          url;
      var api = new Y.juju.Charmworld2({
        apiHost: hostname
      });
      data.push({
        responseText: Y.JSON.stringify({
          name: 'foo'
        })
      });
      // Create a monkeypatched datasource we can use to track the generated
      // apiEndpoint
      var datasource = new Y.DataSource.Local({source: data});
      datasource.realSendRequest = datasource.sendRequest;
      datasource.sendRequest = function(params) {
        url = params.request;
        datasource.realSendRequest(params);
      };

      api.set('datasource', datasource);
      var result = api.search({text: 'foo'}, {
        success: function(data) {
          assert.equal('charms?text=foo', url);
          assert.equal('foo', data.name);
          done();
        },
        failure: function(data, request) {
        }
      }, this);
      api.destroy();
    });

    it('constructs filepaths correctly', function() {
      var hostname = 'http://localhost';
      var api = new Y.juju.Charmworld2({
        apiHost: hostname
      });

      var iconPath = api.filepath('precise/mysql-1', 'icon.svg');
      assert.equal(
          iconPath,
          'http://localhost/api/2/charm/precise/mysql-1/file/icon.svg');
    });

    it('constructs iconpaths correctly', function() {
      var hostname = 'http://localhost';
      var api = new Y.juju.Charmworld2({
        apiHost: hostname
      });

      var iconPath = api.iconpath('precise/mysql-1');
      assert.equal(
          iconPath,
          'http://localhost/api/2/charm/precise/mysql-1/icon.svg');
    });

    it('constructs an icon path for local charms', function() {
      var hostname = 'http://localhost';
      var api = new Y.juju.Charmworld2({
        apiHost: hostname
      });

      var iconPath = api.iconpath('local:precise/mysql-1');
      assert.equal(
          iconPath,
          'http://localhost/static/img/charm_160.svg');
    });

    it('splits the charm id to remove cs: when necessary', function() {
      var hostname = 'http://localhost';
      var api = new Y.juju.Charmworld2({
        apiHost: hostname
      });

      var iconPath = api.iconpath('cs:precise/mysql-1');
      assert.equal(
          iconPath,
          'http://localhost/api/2/charm/precise/mysql-1/icon.svg');
    });

  });

})();

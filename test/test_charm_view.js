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

  describe('juju charm view', function() {
    var CharmView, cleanIconHelper, juju, fakeStore, testUtils, Y, env,
        conn, container, charmResults;

    var charmQuery = '/charms/precise/postgresql/json';

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-views', 'juju-tests-utils', 'juju-env',
        'node-event-simulate', 'juju-charm-store'
      ], function(Y) {
        testUtils = Y.namespace('juju-tests.utils');
        juju = Y.namespace('juju');
        cleanIconHelper = testUtils.stubCharmIconPath();
        done();
      });
    });

    beforeEach(function(done) {
      charmResults = {
        charm: {
          maintainer: 'Mark Mims <mark.mims@canonical.com>',
          series: 'precise',
          owner: 'charmers',
          provides: {
            'db - admin': {
              'interface': 'pgsql'
            },
            db: {
              'interface': 'pgsql'
            }
          },
          options: {
            option0: {
              description: 'The first option.',
              type: 'string'
            },
            option1: {
              description: 'The second option.',
              type: 'boolean'
            },
            option2: {
              description: 'The third option.',
              type: 'int'
            }
          }
        },
        description: 'PostgreSQL is a fully featured RDBMS.',
        name: 'postgresql',
        summary: 'object-relational SQL database (supported version)',
        store_url: 'cs:precise/postgresql-24',
        bzr_branch: 'lp:~charmers/charms/precise/postgresql/trunk',
        last_change:
            { committer: 'David Owen <david.owen@canonical.com>',
              message: 'Only reload for pg_hba updates',
              revno: 24,
              created: 1340206387.539},
        proof: {}
      };
      container = Y.Node.create('<div id="test-container" />');
      Y.one('#main').append(container);
      CharmView = juju.views.charm;
      fakeStore = new Y.juju.Charmworld2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: 
                [{responseText: Y.JSON.stringify(charmResults)}]
            }
          });
        }
      });
      conn = new testUtils.SocketStub();
      env = juju.newEnvironment({conn: conn});
      env.connect();
      conn.open();
      done();
    });

    afterEach(function(done) {
      container.remove(true);
      env.destroy();
      done();
    });

    after(function() {
      cleanIconHelper();
    });

    // Ensure the charm view correctly requests a charm deploy.
    it.only('should be able to deploy a charm', function(done) {
      // Create an instance of CharmView passing a customized env.
      var charmView = new CharmView({
        charm_data_url: charmQuery,
        store: fakeStore,
        env: env});
      var redirected = false;
      charmView.on('navigateTo', function(e) {
        assert.equal('/:gui:/', e.url);
        redirected = true;
      });
      var deployInput = charmView.get('container').one('#charm-deploy');
      deployInput.after('click', function() {
        var msg = conn.last_message();
        // Ensure the websocket received the `deploy` message.
        msg.op.should.equal('deploy');
        var expected = charmResults.series + '/' + charmResults.name;
        msg.charm_url.should.contain(expected);
        // A click to the deploy button redirects to the root page.
        redirected.should.equal(true);
        done();
      });
      deployInput.simulate('click');
    });

    it('should allow for the user to specify a service name', function(done) {
      var charmView = new CharmView(
          { charm_data_url: charmQuery,
            store: fakeStore,
            container: container,
            env: env}).render();
      var serviceName = 'my custom service name';
      var deployButton = container.one('#charm-deploy');
      // Assertions are in a callback, so set them up first.
      deployButton.after('click', function() {
        var msg = conn.last_message();
        assert.equal(msg.op, 'deploy');
        assert.equal(msg.service_name, serviceName);
        done();
      });
      var serviceNameField = container.one('#service-name');
      // Be sure the retrieved node is really an INPUT tag.
      assert.equal(serviceNameField.get('tagName'), 'INPUT');
      serviceNameField.set('value', serviceName);
      deployButton.simulate('click');
    });

    it('should allow for the user to specify a config', function(done) {
      var charmView = new CharmView(
          { charm_data_url: charmQuery,
            store: fakeStore,
            container: container,
            env: env}).render();
      var option0Value = 'the value for option0';
      var deployButton = container.one('#charm-deploy');
      // Assertions are in a callback, so set them up first.
      deployButton.after('click', function() {
        var msg = conn.last_message();
        assert.equal(msg.op, 'deploy');
        assert.property(msg.config, 'option0');
        assert.equal(msg.config.option0, option0Value);
        done();
      });
      container.one('#input-option0').set('value', option0Value);
      deployButton.simulate('click');
    });

    it('should handle charms with no config', function(done) {
      // We appear to mutate a global here, but charmResults will be recreated
      // for the next test in beforeEach.
      delete charmResults.config;
      var charmStore = new juju.CharmStore(
          { datasource: new Y.DataSource.Local(
          { source:
                [{responseText: Y.JSON.stringify(charmResults)}]
          })
          }
          ),
          view = new CharmView(
          { charm_data_url: charmQuery,
            charm_store: charmStore,
            container: container,
            env: env}).render(),
          option0Value = 'the value for option0',
          deployButton = container.one('#charm-deploy');
      assert.equal(view.get('charm').config, null);
      // Assertions are in a callback, so set them up first.
      deployButton.after('click', function() {
        var msg = conn.last_message();
        assert.equal(msg.op, 'deploy');
        done();
      });
      deployButton.simulate('click');
    });

  });

})();

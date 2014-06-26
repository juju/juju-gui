/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

describe('Change version viewlet', function() {
  var Y, utils, models, jujuViews, juju, charmConfig, container, conn, db, ecs,
      env, view, inspector, client, backendJuju, state, service, downgrades;

  before(function(done) {
    var requires = ['juju-gui', 'juju-views', 'juju-tests-utils',
      'event-key', 'juju-charm-store', 'juju-charm-models',
      'node-event-simulate', 'environment-change-set'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
          jujuViews = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          charmConfig = utils.loadFixture(
              'data/mediawiki-api-response.json', true);
          done();
    });
  });

  var setUpInspector = function(serviceAttrs, skipPrepopulate, allowIcon) {
    var charmId = 'precise/mediawiki-14';
    charmConfig.id = charmId;
    var charm = new models.Charm(charmConfig);
    db.charms.add(charm);
    serviceAttrs = Y.mix({
      id: 'mediawiki',
      charm: charmId,
      exposed: false,
      upgrade_available: true,
      upgrade_to: 'cs:precise/mediawiki-15'
    }, serviceAttrs, true);
    service = new models.Service(serviceAttrs);
    downgrades = (function() {
      var versions = [];
      for (var version = 13; version > 0; version -= 1) {
        versions.push('precise/mediawiki-' + version);
      }
      return versions;
    })();
    db.services.add(service);
    if (!skipPrepopulate) {
      db.onDelta({data: {result: [
        ['unit', 'add',
          {id: 'mediawiki/0', agent_state: 'pending',
            charmUrl: 'cs:precise/mediaWiki-14'}],
        ['unit', 'add',
          {id: 'mediawiki/1', agent_state: 'pending',
            charmUrl: 'cs:precise/mediaWiki-14'}],
        ['unit', 'add',
          {id: 'mediawiki/2', agent_state: 'pending',
            charmUrl: 'cs:precise/mediaWiki-14'}]
      ]}});
    }
    var fakeStore = new Y.juju.charmworld.APIv3({});
    fakeStore.iconpath = function(id) {
      if (allowIcon) {
        return '/icon/' + id;
      }
      return '';
    };
    view = new jujuViews.environment({
      container: container,
      db: db,
      env: env,
      store: fakeStore
    });
    view.render();
    Y.Node.create([
      '<div id="content">'
    ].join('')).appendTo(container);
    container.append(
        '<div id="bws-sidebar"><div class="bws-content"></div></div>');
    inspector = view.createServiceInspector(service,
        {databinding: {interval: 0}});
    return inspector;
  };

  beforeEach(function(done) {
    container = utils.makeContainer(this, 'container');
    conn = new utils.SocketStub();
    db = new models.Database();
    ecs = new juju.EnvironmentChangeSet({ db: db });
    env = juju.newEnvironment({conn: conn, ecs: ecs});
    env.connect();
    conn.open();
    inspector = setUpInspector();
    done();
  });

  afterEach(function(done) {
    if (view) {
      if (inspector) {
        delete view.inspector;
      }
      view.destroy();
    }
    env.after('destroy', function() { done(); });
    env.destroy();

    if (client) {
      client.destroy();
    }
    if (backendJuju) {
      backendJuju.destroy();
    }
    if (state) {
      state.destroy();
    }
  });

  it('loads versions on click', function() {
    container.one('.change-version-trigger span').simulate('click');
    assert.equal(container.all('.upgrade-link').size(), 13);
  });

  it('attempts to upgrade on click', function(done) {
    // Ensure that get_charm is called to get the new charm.
    env.setCharm = function(serviceName, upgradeTo, force, callback) {
      callback({});
    };
    env.get_charm = function(upgradeTo, callback) {
      assert.equal(upgradeTo, container.one('.upgrade-link')
        .getData('upgradeto'));
      done();
    };

    container.one('.change-version-trigger span').simulate('click');
    container.one('.upgrade-link').simulate('click');
  });

  it('reflects that a service was upgraded', function(done) {
    var unitId = 'mediawiki/1';

    assert.equal(service.get('charmChanged'), false);
    assert.equal(
        container.one('[data-bind=charmChanged]').hasClass('hidden'), true);

    db.onDelta({data: {result: [
      ['unit', 'change', {id: unitId, charmUrl: 'cs:precise/mediawiki-15'}]
    ]}});

    assert.equal(service.get('charmChanged'), true);
    assert.equal(
        container.one('[data-bind=charmChanged]').hasClass('hidden'), false);
    inspector.get('environment')
      .createServiceInspector = function(model, attrs) {
          assert.equal(model.get('charmChanged'), false);
          done();
        };
    container.one('.rerender-config').simulate('click');
  });
});

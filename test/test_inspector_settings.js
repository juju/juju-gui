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

describe('Inspector Settings', function() {

  var view, service, db, models, utils, juju, env, conn, container,
      inspector, Y, jujuViews, exposeCalled, unexposeCalled, charmConfig;

  before(function(done) {
    var requires = ['juju-gui', 'juju-views', 'juju-tests-utils'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
          jujuViews = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          window.flags = {serviceInspector: true};
          charmConfig = utils
            .loadFixture('data/mediawiki-charmdata.json', true);
          done();
        });

  });

  beforeEach(function() {
    exposeCalled = false;
    unexposeCalled = false;
    container = utils.makeContainer('container');
    conn = new utils.SocketStub();
    db = new models.Database();
    env = juju.newEnvironment({conn: conn});
    env.expose = function(service) {
      exposeCalled = true;
    };
    env.unexpose = function(service) {
      unexposeCalled = true;
    };
  });

  afterEach(function(done) {
    if (view) {
      if (inspector) {
        view.setInspector(inspector, true);
      }
      view.destroy();
    }
    env.after('destroy', function() { done(); });
    env.destroy();
    container.remove(true);
  });

  after(function() {
    delete window.flags;
  });

  var setUpInspector = function() {
    var charmId = 'precise/mediawiki-4';
    var charm = new models.Charm({id: charmId});
    charm.setAttrs(charmConfig);
    db.charms.add(charm);
    service = new models.Service({
      id: 'mediawiki',
      charm: charmId,
      exposed: false});
    db.services.add(service);
    db.onDelta({data: {result: [
      ['unit', 'add', {id: 'mediawiki/0', agent_state: 'pending'}],
      ['unit', 'add', {id: 'mediawiki/1', agent_state: 'pending'}],
      ['unit', 'add', {id: 'mediawiki/2', agent_state: 'pending'}]
    ]}});
    view = new jujuViews.environment({
      container: container,
      db: db,
      env: env
    });
    view.render();
    Y.Node.create([
      '<div id="content">'
    ].join('')).appendTo(container);
    return view.createServiceInspector(service, {databinding: {interval: 0}});
  };

  it('toggles exposure', function() {
    inspector = setUpInspector();
    assert.isFalse(service.get('exposed'));
    assert.isFalse(exposeCalled);
    assert.isFalse(unexposeCalled);
    var expose = container.one('.toggle-expose');
    expose.simulate('click');
    assert.isTrue(service.get('exposed'));
    assert.isTrue(exposeCalled);
    assert.isFalse(unexposeCalled);

    expose.simulate('click');
    assert.isTrue(unexposeCalled);
    assert.isFalse(service.get('exposed'));
  });

});

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

describe('Inspector Overview', function() {

  var view, service, db, models, utils, juju, env, conn, container,
      inspector, Y, jujuViews, ENTER, charmConfig;

  before(function(done) {
    var requires = ['juju-gui', 'juju-views', 'juju-tests-utils',
      'event-key'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
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
    container = utils.makeContainer('container');
    conn = new utils.SocketStub();
    db = new models.Database();
    env = juju.newEnvironment({conn: conn});
    env.connect();
    conn.open();
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
    charmConfig.id = charmId;
    var charm = new models.Charm(charmConfig);
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
    inspector = view.createServiceInspector(service,
        {databinding: {interval: 0}});
    return inspector;
  };

  it('should start with the proper number of units shown in the text field',
     function() {
       inspector = setUpInspector();
       var control = container.one('.num-units-control');
       control.get('value').should.equal('3');
     });

  it('should remove multiple units when the text input changes',
     function() {
       inspector = setUpInspector();
       var control = container.one('.num-units-control');
       control.set('value', 1);
       control.simulate('keydown', { keyCode: ENTER }); // Simulate Enter.
       var message = conn.last_message();
       message.op.should.equal('remove_units');
       message.unit_names.should.eql(['mediawiki/2', 'mediawiki/1']);
     });

  it('should not do anything if requested is < 1',
     function() {
       setUpInspector();
       var control = container.one('.num-units-control');
       control.set('value', 0);
       control.simulate('keydown', { keyCode: ENTER });
       var _ = expect(conn.last_message()).to.not.exist;
       control.get('value').should.equal('3');
     });

  it('should add the correct number of units when entered via text field',
     function() {
       setUpInspector();
       var control = container.one('.num-units-control');
       control.set('value', 7);
       control.simulate('keydown', { keyCode: ENTER });
       var message = conn.last_message();
       message.op.should.equal('add_unit');
       message.service_name.should.equal('mediawiki');
       message.num_units.should.equal(4);
     });
});

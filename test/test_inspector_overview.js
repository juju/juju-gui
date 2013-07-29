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
      'event-key', 'juju-charm-store', 'juju-charm-models'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
          jujuViews = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          window.flags.serviceInspector = true;
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
    delete window.flags.serviceInspector;
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
    var fakeStore = new Y.juju.Charmworld2({});
    fakeStore.iconpath = function() {
      return 'charm icon url';
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

  it('generates a proper statuses object', function() {
    var inspector = setUpInspector(),
        overview = inspector.viewletManager.viewlets.overview;

    // Clear out the units added in the setUpInspector method
    db.units.reset();

    var units = new Y.LazyModelList();

    var c = units.add({ id: 'mysql/2', agent_state: 'pending' }),
        d = units.add({ id: 'mysql/3', agent_state: 'started' }),
        e = units.add({
          id: 'mysql/4',
          agent_state: 'started',
          annotations: {
            'landscape-needs-reboot': 'foo'
          }
        }),
        a = units.add({ id: 'mysql/0', agent_state: 'instal-error' }),
        b = units.add({ id: 'mysql/1', agent_state: 'instal-error' });

    // This order is important.
    var expected = [
      { category: 'error', units: [a, b] },
      { category: 'pending', units: [c] },
      { category: 'running', units: [d, e] },
      { category: 'landscape-needs-reboot', units: [e]},
      { category: 'landscape-security-upgrades', units: []}
    ];
    assert.deepEqual(overview.updateUnitList(units), expected);
  });

  it('generates the unit list data bound elements', function() {
    var inspector = setUpInspector(),
        overview = inspector.viewletManager.viewlets.overview,
        newContainer = utils.makeContainer();

    // Clear out the units added in the setUpInspector method
    db.units.reset();

    var units = new Y.LazyModelList();

    units.add({ id: 'mysql/0', agent_state: 'instal-error' }),
    units.add({ id: 'mysql/1', agent_state: 'instal-error' }),
    units.add({ id: 'mysql/2', agent_state: 'pending' }),
    units.add({ id: 'mysql/3', agent_state: 'started' });

    var statuses = overview.updateUnitList(units);

    overview.generateAndBindUnitHeaders(newContainer, statuses);

    var unitListWrappers = newContainer.all('.unit-list-wrapper');
    var SUH = '.status-unit-header',
        SUC = '.status-unit-content';

    assert.equal(unitListWrappers.size(), 5);
    var wrapper1 = unitListWrappers.item(0);
    assert.equal(wrapper1.one(SUH).hasClass('error'), true);
    assert.equal(wrapper1.one(SUH).hasClass('closed-unit-list'), true);
    assert.equal(wrapper1.one(SUC).hasClass('close-unit'), true);
    assert.equal(wrapper1.one('.unit-qty').getHTML(), 2);
    assert.equal(wrapper1.one('.category-label').getHTML(), 'Error');
    assert.notEqual(wrapper1.one(SUC).getStyle('maxHeight'), undefined);

    var wrapper2 = unitListWrappers.item(1);
    assert.equal(wrapper2.one(SUH).hasClass('pending'), true);
    assert.equal(wrapper2.one(SUH).hasClass('closed-unit-list'), true);
    assert.equal(wrapper2.one(SUC).hasClass('close-unit'), true);
    assert.equal(wrapper2.one('.unit-qty').getHTML(), 1);
    assert.equal(wrapper2.one('.category-label').getHTML(), 'Pending');
    assert.notEqual(wrapper2.one(SUC).getStyle('maxHeight'), undefined);

    var wrapper3 = unitListWrappers.item(2);
    assert.equal(wrapper3.one(SUH).hasClass('running'), true);
    assert.equal(wrapper3.one(SUH).hasClass('closed-unit-list'), true);
    assert.equal(wrapper3.one(SUC).hasClass('close-unit'), true);
    assert.equal(wrapper3.one('.unit-qty').getHTML(), 1);
    assert.equal(wrapper3.one('.category-label').getHTML(), 'Running');
    assert.notEqual(wrapper3.one(SUC).getStyle('maxHeight'), undefined);

    var wrapper4 = unitListWrappers.item(3);
    assert.equal(wrapper4.hasClass('hidden'), true);

    var wrapper5 = unitListWrappers.item(4);
    assert.equal(wrapper5.hasClass('hidden'), true);

    units = new Y.LazyModelList();

    units.add({ id: 'mysql/0', agent_state: 'started' });
    units.add({ id: 'mysql/1', agent_state: 'pending' });
    units.add({ id: 'mysql/2', agent_state: 'pending' });
    units.add({ id: 'mysql/3', agent_state: 'pending' });
    units.add({ id: 'mysql/4', agent_state: 'pending' });
    units.add({ id: 'mysql/5', agent_state: 'pending' });

    statuses = overview.updateUnitList(units);

    overview.generateAndBindUnitHeaders(newContainer, statuses);

    unitListWrappers = newContainer.all('.unit-list-wrapper');

    assert.equal(unitListWrappers.size(), 5);

    wrapper1 = unitListWrappers.item(0);
    assert.equal(wrapper1.hasClass('hidden'), true);

    wrapper2 = unitListWrappers.item(1);
    assert.equal(wrapper2.one(SUH).hasClass('pending'), true);
    assert.equal(wrapper2.one('.unit-qty').getHTML(), 5);
    assert.equal(wrapper2.one('.category-label').getHTML(), 'Pending');
    assert.notEqual(wrapper2.one(SUC).getStyle('maxHeight'), undefined);

    wrapper3 = unitListWrappers.item(2);
    assert.equal(wrapper3.one(SUH).hasClass('running'), true);
    assert.equal(wrapper3.one('.unit-qty').getHTML(), 1);
    assert.equal(wrapper3.one('.category-label').getHTML(), 'Running');
    assert.notEqual(wrapper3.one(SUC).getStyle('maxHeight'), undefined);

    wrapper4 = unitListWrappers.item(3);
    wrapper5 = unitListWrappers.item(4);

    assert.equal(wrapper4.hasClass('hidden'), true);
    assert.equal(wrapper5.hasClass('hidden'), true);

    newContainer.remove(true);
  });
});

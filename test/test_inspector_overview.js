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

  var view, service, db, models, utils, juju, env, conn, container, inspector,
      Y, jujuViews, ENTER, charmConfig, client, backendJuju, state, downgrades,
      exposeCalled, unexposeCalled, ecs;

  before(function(done) {
    var requires = ['juju-gui', 'juju-views', 'juju-tests-utils',
      'event-key', 'juju-charm-store', 'juju-charm-models',
      'node-event-simulate', 'environment-change-set', 'charmstore-api',
      'service-inspector'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
          jujuViews = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          charmConfig = utils.loadFixture(
              'data/mediawiki-api-response.json', true);
          done();
        });

  });

  beforeEach(function() {
    exposeCalled = false;
    unexposeCalled = false;
    container = utils.makeContainer(this, 'container');
    conn = new utils.SocketStub();
    db = new models.Database();
    ecs = new juju.EnvironmentChangeSet({ db: db });
    env = new juju.environments.GoEnvironment({conn: conn, ecs: ecs});
    env.update_annotations = function() {};
    env.expose = function(s) {
      exposeCalled = true;
      service.set('exposed', true);
    };
    env.unexpose = function(s) {
      unexposeCalled = true;
      service.set('exposed', false);
    };
    env.connect();
    conn.open();
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
    }, serviceAttrs, true, null, 0, true);
    service = new models.Service(serviceAttrs);
    downgrades = (function() {
      var versions = [];
      for (var version = 13; version > 0; version = version - 1) {
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
    var fakeStore = new Y.juju.charmstore.APIv4({});
    fakeStore.getIconPath = function(id) {
      if (allowIcon) {
        return '/icon/' + id;
      }
      return '';
    };
    view = new jujuViews.environment({
      container: container,
      db: db,
      env: env,
      charmstore: fakeStore
    });
    view.render();
    Y.Node.create([
      '<div id="content">'
    ].join('')).appendTo(container);
    container.append(
        '<div id="bws-sidebar"><div class="bws-content"></div></div>');
    inspector = new jujuViews.ServiceInspector({
      db: db,
      model: service,
      env: env,
      enableDatabinding: true,
      databinding: { interval: 0 },
      charmstore: view.get('charmstore')
    });
    inspector.render();

    return inspector;
  };

  // Simulate the click to scale up/down the service units.
  // The value argument is the number of units to set.
  // Return the units control node.
  var scaleUnits = function(value) {
    var control = container.one('.num-units-control');
    control.set('value', value);
    control.simulate('keydown', {keyCode: ENTER});
    return control;
  };

  it('is created with the proper template context', function() {
    inspector = setUpInspector();
    assert.deepEqual(inspector.templateConfig, {});
  });

  it('is created with the proper template context if subordinate', function() {
    inspector = setUpInspector({subordinate: true});
    assert.deepEqual(inspector.templateConfig, {subordinate: true});
  });

  it('should show the proper icon based off the charm model', function() {
    inspector = setUpInspector(null, null, true);
    var icon = container.one('.icon img');

    // The icon url comes from the fake store and the service charm attribute.
    assert.equal(icon.getAttribute('src'), '/icon/precise/mediawiki-14');
  });

  it('renders the scale up view', function() {
    var ScaleUp = Y.juju.viewlets.ScaleUp;
    var Overview = Y.juju.viewlets.Overview;

    var render = utils.makeStubMethod(ScaleUp.prototype, 'render');
    var hideScaleUp = utils.makeStubMethod(ScaleUp.prototype, 'hideScaleUp');
    var update = utils.makeStubMethod(Overview.prototype, 'updateUnitCounts');

    this._cleanups.push(render.reset);
    this._cleanups.push(hideScaleUp.reset);
    this._cleanups.push(update.reset);

    inspector = setUpInspector();
    assert.equal(inspector.views.overview.scaleUp instanceof ScaleUp, true);
    assert.equal(render.calledOnce(), true, 'render not called once');
    assert.equal((update.callCount() > 0), true, 'unit counts not updating');
  });

  it('closes the scale up view on a pending service', function() {
    inspector = setUpInspector({pending: true});
    assert.equal(container.one('.scale-up-view').hasClass('state-default'),
        true);
  });

  it('closes the scale up view on a deployed service', function() {
    inspector = setUpInspector({pending: false});
    assert.equal(container.one('.scale-up-view').hasClass('state-default'),
        true);
  });

  it('sets the scale up unit count', function() {
    var uncommittedCount = 1;
    var unitCount;
    inspector = setUpInspector();
    db.addUnits({
      id: 'mediawiki/20',
      displayName: 'mediawiki/20'
    });
    unitCount = db.units.size() - uncommittedCount;
    assert.equal(container.one('.unit-count').get('text'),
        unitCount + ' units');
    assert.equal(container.one('.uncommitted-unit-count').get('text'),
        '(' + uncommittedCount + ' uncommitted)');
  });

  it('does not show the uncommitted units label if there are none', function() {
    inspector = setUpInspector();
    assert.equal(container.one('.uncommitted-unit-count').get('text'), '');
  });

  it('does not pluralise the unit count if there is one unit', function() {
    inspector = setUpInspector(null, true);
    db.addUnits({
      id: 'mediawiki/20',
      displayName: 'mediawiki/20',
      agent_state: 'started'
    });
    assert.equal(container.one('.unit-count').get('text'), '1 unit');
  });

  it('catches scaleUp changeState and re-fires', function(done) {
    inspector = setUpInspector();
    inspector.on('*:changeState', function(e) {
      assert.equal(e.details[0], 'foo');
      done();
    });
    inspector.views.overview.scaleUp.fire('changeState', 'foo');
  });

  it('should start with the proper number of units shown in the text field',
     function() {
       inspector = setUpInspector();
       var control = container.one('.num-units-control');
       control.get('value').should.equal('3');
     });

  it('should remove multiple units when the text input changes',
     function() {
       inspector = setUpInspector();
       scaleUnits(1);
       ecs.commit(env);
       var message = conn.last_message();
       assert.equal('DestroyServiceUnits', message.Request);
       assert.deepEqual(
       ['mediawiki/2', 'mediawiki/1'], message.Params.UnitNames);
     });

  it('should not do anything if requested is < 1',
     function() {
       setUpInspector();
       var control = scaleUnits(0);
       ecs.commit(env);
       assert.isUndefined(conn.last_message());
       control.get('value').should.equal('3');
     });

  it('should add the correct number of units when entered via text field',
     function() {
       setUpInspector();
       scaleUnits(7);
       // confirm the 'please confirm constraints' dialogue
       container.one('.confirm-num-units').simulate('click');
       assert.equal(container.one('.unit-constraints-confirm')
                       .one('span:first-child')
                       .getHTML(), 'Scale out with these constraints?');
       ecs.commit(env);
       var message = conn.last_message();
       assert.equal('AddServiceUnits', message.Request);
       assert.equal('mediawiki', message.Params.ServiceName);
       assert.equal(4, message.Params.NumUnits);
     });

  it('disables unit control while adding units, then reenables', function() {
    setUpInspector();
    var control = scaleUnits(10);
    // Confirm the 'please confirm constraints' dialogue.
    container.one('.confirm-num-units').simulate('click');
    // During scaling the control is disabled.
    assert.isTrue(control.get('disabled'));
    // Generate a message that indicates the service is done scaling.
    ecs.commit(env);
    var message = conn.last_message();
    conn.msg({
      RequestId: message.RequestId,
      Error: undefined,
      Response: {Units: message.Params.NumUnits}
    });
    // Now that scaling is complete, the control is reenabled.
    assert.isFalse(control.get('disabled'));
  });

  it('disables unit control while removing units, then reenables', function() {
    setUpInspector();
    var control = container.one('.num-units-control');
    // There are already more than one units deployed for the service.
    assert.isTrue(control.get('value') > 1, 'value starts greater than one');
    // Scale the number of units down and show that the control is reenabled.
    control.set('value', 1);
    control.simulate('keydown', { keyCode: ENTER });
    ecs.commit(env);
    //  During scaling the control is disabled.
    assert.isTrue(control.get('disabled'), 'disabled while scaling down');
    // Generate a message that indicates the service is done scaling.
    var message = conn.last_message();
    conn.msg({
      RequestId: message.RequestId,
      Error: undefined,
      Response: {Units: message.Params.NumUnits}
    });
    // Now that scaling is complete, the control is reenabled.
    assert.isFalse(control.get('disabled'), 'enabled after scaling down');
  });

  it('shows default constraint values when upscaling', function() {
    setUpInspector();
    scaleUnits(10);
    var details = container.one('.constraint-details').getContent();
    assert.include(details, 'default CPU power');
    assert.include(details, 'default CPU cores');
    assert.include(details, 'default memory');
    assert.include(details, 'default disk');
  });

  it('shows customized constraint values when upscaling', function() {
    var constraints = {
      'cpu-power': 42,
      'cpu-cores': 1,
      mem: 1024,
      'root-disk': 2048
    };
    setUpInspector({constraints: constraints});
    scaleUnits(10);
    var details = container.one('.constraint-details').getContent();
    assert.include(details, '42Ghz');
    assert.include(details, '1 core');
    assert.include(details, '1024MB');
    assert.include(details, '2048MB');
  });

  it('pluralizes the number of cores when upscaling', function() {
    setUpInspector({constraints: {'cpu-cores': 4}});
    scaleUnits(10);
    var details = container.one('.constraint-details').getContent();
    assert.include(details, 'default CPU power');
    assert.include(details, '4 cores');
    assert.include(details, 'default memory');
    assert.include(details, 'default disk');
  });

  it('does not display the unit scaling widgets if subordinate', function() {
    inspector = setUpInspector({subordinate: true});
    assert.strictEqual(container.all('.unit-scaling').size(), 0);
  });

  it('does not display the constraints widgets if subordinate', function() {
    inspector = setUpInspector({subordinate: true});
    assert.strictEqual(container.all('.inspector_constraints').size(), 0);
  });

  it('generates a proper statuses object', function() {
    var inspector = setUpInspector(),
        overview = inspector.views.overview;

    var units = new Y.LazyModelList();

    var a, b, c, d, e, f;
    c = units.add({
      id: 'mysql/2',
      displayName: 'mysql/2',
      agent_state: 'pending'
    });
    d = units.add({
      id: 'mysql/3',
      displayName: 'mysql/3',
      agent_state: 'started'
    });
    e = units.add({
      id: 'mysql/4',
      displayName: 'mysql/4',
      agent_state: 'started',
      annotations: {
        'landscape-needs-reboot': 'foo'
      }
    });
    a = units.add({
      id: 'mysql/0',
      displayName: 'mysql/0',
      agent_state: 'error',
      agent_state_info: 'hook failed: "install"'
    });
    b = units.add({
      id: 'mysql/1',
      displayName: 'mysql/1',
      agent_state: 'error',
      agent_state_info: 'hook failed: "install"'
    });
    f = units.add({
      id: '$foobar/5',
      displayName: 'mysql/5'
    });
    // This order is important.
    // Addiitonally, do not change the way this object is laid out or formatted,
    // the test fails for unknown reasons if you do.
    var expected = [
      { type: 'unit', category: 'uncommitted', categoryType: 'uncommitted',
        units: [
          { unit: f, category: 'uncommitted', categoryType: 'uncommitted' }] },
      { type: 'unit', category: 'hook failed: "install"', categoryType: 'error',
        units: [
          {
            unit: a,
            category: 'hook failed: "install"',
            categoryType: 'error'
          }, {
            unit: b,
            category: 'hook failed: "install"',
            categoryType: 'error'
          }
        ] },
      { type: 'unit', category: 'pending', categoryType: 'pending',
        units: [{ unit: c, category: 'pending', categoryType: 'pending' }] },
      { type: 'unit', category: 'running', categoryType: 'running',
        units: [
          { unit: d, category: 'running', categoryType: 'running' },
          { unit: e, category: 'running', categoryType: 'running' }
        ] },
      { type: 'unit', category: 'landscape-needs-reboot',
        categoryType: 'landscape', units: [
          { unit: e, category: 'landscape-needs-reboot',
            categoryType: 'landscape'}
        ]}
    ];
    assert.deepEqual(overview.updateStatusList(units), expected);
  });

  it('generates category names appropriately', function() {
    var outputInput = {
      'hook failed: "install"': {
        category: 'hook failed: "install"',
        categoryType: 'error',
        type: 'unit',
        units: []
      },
      'pending units': {
        type: 'unit',
        category: 'pending',
        categoryType: 'pending',
        units: []
      },
      // Needs to be able to handle different pending types
      'foobar units': {
        type: 'unit',
        category: 'foobar',
        categoryType: 'pending',
        units: []
      },
      'running units': {
        type: 'unit',
        category: 'running',
        categoryType: 'running',
        units: []
      },
      'machines need to be restarted': {
        type: 'unit',
        category: 'landscape-needs-reboot',
        categoryType: 'landscape',
        units: []
      },
      'security upgrades available': {
        type: 'unit',
        category: 'landscape-security-upgrades',
        categoryType: 'landscape',
        units: []
      }
    };

    var inspector = setUpInspector(),
        overview = inspector.views.overview;

    Y.Object.each(outputInput, function(value, key, obj) {
      assert.equal(overview.categoryName(value), key);
    });
  });

  it('generates the unit list data bound elements', function() {
    var inspector = setUpInspector(),
        overview = inspector.views.overview,
        newContainer = utils.makeContainer(this);

    var units = new Y.LazyModelList();

    units.add({
      id: 'mysql/0',
      displayName: 'mysql/0',
      agent_state: 'error',
      agent_state_info: 'hook failed: "install"'
    });
    units.add({
      id: 'mysql/1',
      displayName: 'mysql/1',
      agent_state: 'error',
      agent_state_info: 'hook failed: "install"'
    });
    units.add({
      id: 'mysql/2',
      displayName: 'mysql/2',
      agent_state: 'pending'
    });
    units.add({
      id: 'mysql/3',
      displayName: 'mysql/3',
      agent_state: 'started'
    });
    units.add({
      id: '$foobar/4',
      displayName: 'mysql/4'
    });
    var statuses = overview.updateStatusList(units);

    overview.generateAndBindStatusHeaders(
        newContainer, statuses, db.environment);

    var unitListWrappers = newContainer.all('.unit-list-wrapper');
    var SUH = '.status-unit-header',
        SUC = '.status-unit-content';

    assert.equal(unitListWrappers.size(), 4);

    var uncommittedWrapper = unitListWrappers.item(0);
    assert.equal(uncommittedWrapper.one(SUH).hasClass('uncommitted'), true);
    assert.equal(
        uncommittedWrapper.one(SUH).hasClass('closed-unit-list'), true);
    assert.equal(uncommittedWrapper.one(SUC).hasClass('close-unit'), true);
    assert.equal(uncommittedWrapper.one('.unit-qty').getHTML(), 1);
    var exampleUnit = uncommittedWrapper.all('li').item(1);
    assert.equal(exampleUnit.get('text'), 'mysql/4');

    var errorWrapper = unitListWrappers.item(1);
    assert.equal(errorWrapper.one(SUH).hasClass('error'), true);
    assert.equal(errorWrapper.one(SUH).hasClass('closed-unit-list'), true);
    assert.equal(errorWrapper.one(SUC).hasClass('close-unit'), true);
    assert.equal(errorWrapper.one('.unit-qty').getHTML(), 2);
    assert.equal(
        errorWrapper.one('.category-label').getHTML(),
        'hook failed: "install"');
    assert.notEqual(errorWrapper.one(SUC).getStyle('maxHeight'), undefined);

    var pendingWrapper = unitListWrappers.item(2);
    assert.equal(pendingWrapper.one(SUH).hasClass('pending'), true);
    assert.equal(pendingWrapper.one(SUH).hasClass('closed-unit-list'), true);
    assert.equal(pendingWrapper.one(SUC).hasClass('close-unit'), true);
    assert.equal(pendingWrapper.one('.unit-qty').getHTML(), 1);
    assert.equal(
        pendingWrapper.one('.category-label').getHTML(), 'pending units');
    assert.notEqual(pendingWrapper.one(SUC).getStyle('maxHeight'), undefined);

    var runningWrapper = unitListWrappers.item(3);
    assert.equal(runningWrapper.one(SUH).hasClass('running'), true);
    assert.equal(runningWrapper.one(SUH).hasClass('closed-unit-list'), true);
    assert.equal(runningWrapper.one(SUC).hasClass('close-unit'), true);
    assert.equal(runningWrapper.one('.unit-qty').getHTML(), 1);
    assert.equal(
        runningWrapper.one('.category-label').getHTML(), 'running units');
    assert.notEqual(runningWrapper.one(SUC).getStyle('maxHeight'), undefined);
    exampleUnit = runningWrapper.all('li').item(1);
    assert.equal(exampleUnit.get('text'), 'mysql/3');

    units = new Y.LazyModelList();

    units.add({
      id: 'mysql/0',
      displayName: 'mysql/0',
      agent_state: 'started'
    });
    units.add({
      id: 'mysql/1',
      displayName: 'mysql/1',
      agent_state: 'pending'
    });
    units.add({
      id: 'mysql/2',
      displayName: 'mysql/2',
      agent_state: 'pending'
    });
    units.add({
      id: 'mysql/3',
      displayName: 'mysql/3',
      agent_state: 'pending'
    });
    units.add({
      id: 'mysql/4',
      displayName: 'mysql/4',
      agent_state: 'pending'
    });
    units.add({
      id: 'mysql/5',
      displayName: 'mysql/5',
      agent_state: 'pending'
    });

    statuses = overview.updateStatusList(units);

    overview.generateAndBindStatusHeaders(
        newContainer, statuses, db.environment);

    unitListWrappers = newContainer.all('.unit-list-wrapper');

    assert.equal(unitListWrappers.size(), 2);

    pendingWrapper = unitListWrappers.item(0);
    assert.equal(pendingWrapper.one(SUH).hasClass('pending'), true);
    assert.equal(pendingWrapper.one('.unit-qty').getHTML(), 5);
    assert.equal(
        pendingWrapper.one('.category-label').getHTML(), 'pending units');
    assert.notEqual(pendingWrapper.one(SUC).getStyle('maxHeight'), undefined);

    runningWrapper = unitListWrappers.item(1);
    assert.equal(runningWrapper.one(SUH).hasClass('running'), true);
    assert.equal(runningWrapper.one('.unit-qty').getHTML(), 1);
    assert.equal(
        runningWrapper.one('.category-label').getHTML(), 'running units');
    assert.notEqual(runningWrapper.one(SUC).getStyle('maxHeight'), undefined);

    newContainer.remove(true);
  });

  it('updates the Landscape link when reboot section is revealed', function() {
    var inspector = setUpInspector(),
        overview = inspector.views.overview,
        newContainer = utils.makeContainer(this);

    var units = new Y.LazyModelList();

    units.add({ id: 'mysql/0', agent_state: 'started' });

    var statuses = overview.updateStatusList(units);

    overview.generateAndBindStatusHeaders(
        newContainer, statuses, db.environment);

    var unitListWrappers = newContainer.all('.unit-list-wrapper');

    assert.equal(unitListWrappers.size(), 1);

    units.item(0).annotations = {'landscape-needs-reboot': true};
    var envAnno = {};
    envAnno['landscape-url'] = 'http://landscape.example.com';
    envAnno['landscape-computers'] = '/computers/criteria/environment:test';
    envAnno['landscape-reboot-alert-url'] =
        '+alert:computer-reboot/info#power';
    envAnno['landscape-security-alert-url'] =
        '+alert:security-upgrades/packages/list?filter=security';
    db.environment.set('annotations', envAnno);
    service.set('annotations', {
      'landscape-computers': '+service:mediawiki'});

    statuses = overview.updateStatusList(units);

    overview.generateAndBindStatusHeaders(
        newContainer, statuses, db.environment);

    unitListWrappers = newContainer.all('.unit-list-wrapper');
    assert.equal(unitListWrappers.size(), 2);

    assert.equal(
        unitListWrappers.item(1).one('a.landscape').get('href'),
        'http://landscape.example.com/computers/criteria/' +
        'environment:test+service:mediawiki/');
  });

  it('updates the Landscape link when upgrade section is revealed', function() {
    var inspector = setUpInspector(),
        overview = inspector.views.overview,
        newContainer = utils.makeContainer(this);

    var units = new Y.LazyModelList();

    units.add({ id: 'mysql/0', agent_state: 'started' });

    var statuses = overview.updateStatusList(units);

    overview.generateAndBindStatusHeaders(
        newContainer, statuses, db.environment);

    var unitListWrappers = newContainer.all('.unit-list-wrapper');

    assert.equal(unitListWrappers.size(), 1);

    units.item(0).annotations = {'landscape-security-upgrades': true};
    var envAnno = {};
    envAnno['landscape-url'] = 'http://landscape.example.com';
    envAnno['landscape-computers'] = '/computers/criteria/environment:test';
    envAnno['landscape-reboot-alert-url'] =
        '+alert:computer-reboot/info#power';
    envAnno['landscape-security-alert-url'] =
        '+alert:security-upgrades/packages/list?filter=security';
    db.environment.set('annotations', envAnno);
    service.set('annotations', {
      'landscape-computers': '+service:mediawiki'});

    statuses = overview.updateStatusList(units);

    overview.generateAndBindStatusHeaders(
        newContainer, statuses, db.environment);

    unitListWrappers = newContainer.all('.unit-list-wrapper');
    assert.equal(unitListWrappers.size(), 2);

    assert.equal(
        unitListWrappers.item(1).one('a.landscape').get('href'),
        'http://landscape.example.com/computers/criteria/' +
        'environment:test+service:mediawiki/');
  });

  it('reflects that a service is dying', function() {
    var inspector = setUpInspector();
    var views = inspector.views;
    var newContainer = views.inspectorHeader.get('container');
    var service = db.services.getById('mediawiki');
    // The service is considered to be alive by default.
    assert.strictEqual(service.get('life'), 'alive');
    assert.strictEqual(
        newContainer.one('[data-bind=life]').hasClass('hidden'), true);
    // The inspector message is shown when the service's life is set to dying.
    service.set('life', 'dying');
    assert.strictEqual(
        newContainer.one('[data-bind=life]').hasClass('hidden'), false);
  });

  it('toggles exposure', function() {
    inspector = setUpInspector();
    assert.isFalse(service.get('exposed'));
    assert.isFalse(exposeCalled);
    assert.isFalse(unexposeCalled);
    var vmContainer = inspector.get('container');
    var expose = vmContainer.one('label[for=expose-toggle]');
    expose.simulate('click');
    assert.isTrue(service.get('exposed'));
    assert.isTrue(exposeCalled);
    assert.isFalse(unexposeCalled);
    var checkedSelector = 'input.expose-toggle:checked ~ label .handle';
    var handle = vmContainer.one(checkedSelector);
    assert.equal(handle instanceof Y.Node, true);

    expose.simulate('click');
    assert.isTrue(unexposeCalled);
    assert.isFalse(service.get('exposed'));
    handle = vmContainer.one(checkedSelector);
    assert.equal(handle instanceof Y.Node, false);
  });

  it('does not display the expose option', function() {
    inspector = setUpInspector({pending: true, displayName: '(wordpress)'});
    assert.equal(inspector.get('container').one('.expose').hasClass('hidden'),
        true);
  });

  it('displays the expose option once deployed', function() {
    inspector = setUpInspector({pending: true, displayName: '(wordpress)'});
    var expose = inspector.get('container').one('.expose');
    assert.equal(expose.hasClass('hidden'), true);
    inspector.get('model').set('pending', false);
    inspector.render();
    assert.equal(expose.hasClass('hidden'), false);
  });

  describe('Unit action buttons', function() {
    it('sends the resolve cmd to the env for the selected units', function() {
      inspector = setUpInspector(null, true);
      var unitId = 'mediawiki/7';

      db.onDelta({data: {result: [
        ['unit', 'add', {
          id: unitId,
          agent_state: 'error',
          agent_state_info: 'hook failed: "install"'
        }]
      ]}});

      var mgrContainer = inspector.get('container');
      var retryButton = mgrContainer.one('button.unit-action-button.resolve');
      var unit = mgrContainer.one(
          'input[type=checkbox][name="' + unitId + '"]');

      assert.equal(retryButton instanceof Y.Node, true);
      assert.equal(unit instanceof Y.Node, true);

      unit.simulate('click');
      retryButton.simulate('click');

      var expected = {
        Params: {
          Retry: false,
          UnitName: 'mediawiki/7'
        },
        Request: 'Resolved',
        RequestId: 1,
        Type: 'Client'
      };
      assert.deepEqual(expected, env.ws.last_message());
    });

    it('sends the retry command to the env for the selected unit', function() {
      inspector = setUpInspector(null, true);
      var unitId = 'mediawiki/7';

      db.onDelta({data: {result: [
        ['unit', 'add', {
          id: unitId,
          agent_state: 'error',
          agent_state_info: 'hook failed: "install"'
        }]
      ]}});

      var mgrContainer = inspector.get('container');
      var retryButton = mgrContainer.one('button.unit-action-button.retry');
      var unit = mgrContainer.one(
          'input[type=checkbox][name="' + unitId + '"]');

      assert.equal(retryButton instanceof Y.Node, true);
      assert.equal(unit instanceof Y.Node, true);

      unit.simulate('click');
      retryButton.simulate('click');

      var expected = {
        Params: {
          Retry: true,
          UnitName: 'mediawiki/7'
        },
        Request: 'Resolved',
        RequestId: 1,
        Type: 'Client'
      };
      assert.deepEqual(env.ws.last_message(), expected);
    });

    it('sends the remove command to the env for the selected unit', function() {
      inspector = setUpInspector(null, true);
      var unitId = 'mediawiki/7';

      db.onDelta({data: {result: [
        ['unit', 'add', {id: unitId, agent_state: 'error'}]
      ]}});


      var mgrContainer = inspector.get('container');
      var removeButton = mgrContainer.one('button.unit-action-button.remove');
      var unit = mgrContainer.one(
          'input[type=checkbox][name="' + unitId + '"]');

      assert.equal(removeButton instanceof Y.Node, true,
          'removeButton is not an instance of Y.Node');
      assert.equal(unit instanceof Y.Node, true,
          'unit is not an instance of Y.Node');

      unit.simulate('click');
      removeButton.simulate('click');

      var expected = {
        Params: {UnitNames: ['mediawiki/7']},
        Request: 'DestroyServiceUnits',
        RequestId: 1,
        Type: 'Client'
      };

      ecs.commit(env);
      assert.deepEqual(env.ws.last_message(), expected);
    });

    it('generates the button display map for each unit category', function() {
      inspector = setUpInspector();
      var buttons = {
        'error': {resolve: true, retry: true, remove: true},
        'pending': {remove: true},
        'running': {remove: true},
        'landscape': {landscape: true}
      };
      var overview = inspector.views.overview;
      Y.Object.each(buttons, function(results, category) {
        var buttonList = overview.generateActionButtonList(category);
        assert.deepEqual(buttonList, results);
      });
    });
  });

  describe('Inspector level actions', function() {
    afterEach(function(done) {
      window.flags = {};
    });

    it('fires changeState event to open unit details', function() {
      inspector = setUpInspector(null);
      var fireStub = utils.makeStubMethod(inspector.views.overview, 'fire');
      inspector.get('container').one('a[data-unit]').simulate('click');
      assert.equal(fireStub.calledOnce(), true);
      var fireArgs = fireStub.lastArguments();
      assert.equal(fireArgs[0], 'changeState');
      assert.deepEqual(fireArgs[1], {
        sectionA: {
          metadata: {
            unit: '0',
            charm: false
          }
        }
      });
    });

    it('should fire the changeState event when closed', function() {
      inspector = setUpInspector(null, true);
      var fireStub = utils.makeStubMethod(inspector, 'fire');
      this._cleanups.push(fireStub.reset);
      inspector.get('container').one('.close').simulate('click');
      assert.equal(fireStub.calledOnce(), true);
      var fireArgs = fireStub.lastArguments();
      assert.equal(fireArgs[0], 'changeState');
      assert.deepEqual(fireArgs[1], {
        sectionA: {
          component: null,
          metadata: { id: null }}});
    });
  });
});

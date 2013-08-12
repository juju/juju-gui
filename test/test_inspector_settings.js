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
    var requires = ['juju-gui', 'juju-views', 'juju-tests-utils',
      'juju-charm-store', 'juju-charm-models'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
          jujuViews = Y.namespace('juju.views');
          juju = Y.namespace('juju');
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
    env.expose = function(s) {
      exposeCalled = true;
      service.set('exposed', true);
    };
    env.unexpose = function(s) {
      unexposeCalled = true;
      service.set('exposed', false);
    };
    window.flags.serviceInspector = true;
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
    window.flags = {};
  });

  var setUpInspector = function(options) {
    var charmId = 'precise/mediawiki-6';
    charmConfig.id = charmId;
    var charm = new models.Charm(charmConfig);
    db.charms.add(charm);
    if (options && options.useGhost) {
      service = db.services.ghostService(charm);
    } else {
      var parsedConfig = {};
      // because a test deletes the config data we need a check to
      // stop it from falling over.
      if (charm.get('config')) {
        Y.Object.each(charm.get('config').options, function(val, key) {
          parsedConfig[key] = val['default'] || '';
        });
      }
      service = new models.Service({
        id: 'mediawiki',
        charm: charmId,
        exposed: false,
        config: parsedConfig
      });
      db.services.add(service);
      db.onDelta({data: {result: [
        ['unit', 'add', {id: 'mediawiki/0', agent_state: 'pending'}],
        ['unit', 'add', {id: 'mediawiki/1', agent_state: 'pending'}],
        ['unit', 'add', {id: 'mediawiki/2', agent_state: 'pending'}]
      ]}});
    }
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
    return view.createServiceInspector(service, {databinding: {interval: 0}});
  };

  it('properly renders a service without charm options', function() {
    // Mutate charmConfig before the render.
    delete charmConfig.config;
    inspector = setUpInspector();
    // Verify the viewlet rendered, previously it would raise.
    assert.isObject(container.one('.config-file'));
    // Restore the test global
    charmConfig = utils.loadFixture('data/mediawiki-charmdata.json', true);

  });

  it('toggles exposure', function() {
    inspector = setUpInspector();
    assert.isFalse(service.get('exposed'));
    assert.isFalse(exposeCalled);
    assert.isFalse(unexposeCalled);
    var vmContainer = inspector.viewletManager.get('container');
    var expose = vmContainer.one('label[for=expose-toggle]');
    var exposeLabel = expose.one('.handle');
    expose.simulate('click');
    assert.isTrue(service.get('exposed'));
    assert.isTrue(exposeCalled);
    assert.isFalse(unexposeCalled);
    var checkedSelector = 'input.hidden-checkbox:checked ~ label .handle';
    var handle = vmContainer.one(checkedSelector);
    assert.equal(handle instanceof Y.Node, true);

    expose.simulate('click');
    assert.isTrue(unexposeCalled);
    assert.isFalse(service.get('exposed'));
    handle = vmContainer.one(checkedSelector);
    assert.equal(handle instanceof Y.Node, false);
  });

  /**** Begin service destroy UI tests. ****/

  it('has a button to destroy the service', function() {
    inspector = setUpInspector();
    assert.isObject(container.one('.destroy-service-trigger span'));
  });

  it('shows the destroy service prompt if the trigger is clicked', function() {
    inspector = setUpInspector();
    var promptBox = container.one('.destroy-service-prompt');
    assert.isTrue(promptBox.hasClass('closed'));
    container.one('.destroy-service-trigger span').simulate('click');
    assert.isFalse(promptBox.hasClass('closed'));
  });

  it('hides the destroy service prompt if cancel is clicked', function() {
    inspector = setUpInspector();
    var promptBox = container.one('.destroy-service-prompt');
    assert.isTrue(promptBox.hasClass('closed'));
    // First we have to open the prompt.
    container.one('.destroy-service-trigger span').simulate('click');
    assert.isFalse(promptBox.hasClass('closed'));
    // Now we can close it.
    container.one('.cancel-destroy').simulate('click');
    assert.isTrue(promptBox.hasClass('closed'));
  });

  it('initiates a destroy if the "Destroy" button is clicked', function(done) {
    inspector = setUpInspector();
    var promptBox = container.one('.destroy-service-prompt');
    // First we have to open the prompt.
    container.one('.destroy-service-trigger span').simulate('click');
    assert.isFalse(promptBox.hasClass('closed'));
    // If the test times out, it failed (because the expected function call
    // didn't happen).
    inspector.initiateServiceDestroy = function() {
      done();
    };
    container.one('.initiate-destroy').simulate('click');
  });

  it('wires up UI elements to handlers for service inspector', function() {
    // There are UI elements and they all have to be wired up to something.
    inspector = setUpInspector();
    var events = inspector.viewletManager.events;
    assert.equal(
        typeof events['.destroy-service-trigger span'].click, 'function');
    assert.equal(typeof events['.initiate-destroy'].click, 'function');
    assert.equal(typeof events['.cancel-destroy'].click, 'function');
  });

  it('wires up UI elements to handlers for ghost inspector', function() {
    // There are UI elements and they all have to be wired up to something.
    inspector = setUpInspector({useGhost: true});
    var events = inspector.viewletManager.events;
    assert.equal(
        typeof events['.destroy-service-trigger span'].click, 'function');
    assert.equal(typeof events['.initiate-destroy'].click, 'function');
    assert.equal(typeof events['.cancel-destroy'].click, 'function');
  });

  it('responds to service removal by cleaning out the DB', function() {
    // If destroying a service succeeds, the service is removed from the
    // database.
    var removeServiceCalled, removeRelationsCalled;

    inspector = setUpInspector();

    var service = {
      get: function(name) {
        assert.equal(name, 'id');
        return 'SERVICE-ID';
      }
    };
    var RELATIONS = 'all of the relations of the service being removed';

    var db = {
      services: {
        remove: function(serviceToBeRemoved) {
          assert.deepEqual(serviceToBeRemoved, service);
          removeServiceCalled = true;
        }
      },
      relations: {
        filter: function(predicate) {
          return RELATIONS;
        },
        remove: function(relationsToBeRemoved) {
          assert.deepEqual(relationsToBeRemoved, RELATIONS);
          removeRelationsCalled = true;
        }
      }
    };

    var evt = {err: false};

    inspector._destroyServiceCallback(service, db, evt);
    assert.isTrue(removeServiceCalled);
    assert.isTrue(removeRelationsCalled);
  });

  it('responds to service removal failure by alerting the user', function() {
    var notificationAdded;

    inspector = setUpInspector();

    var SERVICE_NAME = 'the name of the service being removed';
    var evt = {
      err: true,
      service_name: SERVICE_NAME
    };

    var db = {
      notifications: {
        add: function(notification) {
          var attrs = notification.getAttrs();
          // The notification has the required attributes.
          assert.isTrue(attrs.hasOwnProperty('title'));
          assert.isTrue(attrs.hasOwnProperty('message'));
          // The service name is mentioned in the error message.
          assert.notEqual(attrs.message.indexOf(SERVICE_NAME, -1));
          assert.equal(attrs.level, 'error');
          assert.deepEqual(attrs.modelId, ['service', 'mediawiki']);
          notificationAdded = true;
        }
      }
    };

    inspector._destroyServiceCallback(service, db, evt);
    assert.isTrue(notificationAdded);
  });

  /**** End service destroy UI tests. ****/

  it('saves changes to settings values', function() {
    inspector = setUpInspector();
    env.connect();
    var vmContainer = inspector.viewletManager.get('container'),
        input = vmContainer.one('textarea[name=admins]'),
        button = vmContainer.one('.configuration-buttons .confirm');

    assert.equal(db.services.item(0).get('config').admins, '');
    input.simulate('focus');
    input.set('value', 'foo');
    // XXX simulate focus doesn't work in IE10 yet
    if (Y.UA.ie !== 10) {
      assert.equal(vmContainer.all('.modified').size(), 1);
    }

    button.simulate('click');
    assert.equal(env.ws.last_message().config.admins, 'foo');
    assert.equal(vmContainer.all('.modified').size(), 0);
    assert.equal(button.getHTML(), 'Save Changes');
  });

});

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
      inspector, Y, jujuViews, charmData;

  before(function(done) {
    var requires = ['juju-gui', 'juju-views', 'juju-tests-utils',
      'juju-charm-store', 'juju-charm-models'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
          jujuViews = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          charmData = utils.loadFixture(
              'data/mediawiki-api-response.json',
              true);
          done();
        });

  });

  beforeEach(function() {
    container = utils.makeContainer('container');
    conn = new utils.SocketStub();
    db = new models.Database();
    env = juju.newEnvironment({conn: conn});
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

  var setUpInspector = function(options) {
    var charm = new models.Charm(charmData.charm),
        charmId = charm.get('id');
    db.charms.add(charm);
    if (options && options.useGhost) {
      service = db.services.ghostService(charm);
    } else {
      var parsedConfig = {};
      // because a test deletes the config data we need a check to
      // stop it from falling over.
      if (charm.get('options')) {
        Y.Object.each(charm.get('options'), function(val, key) {
          // For boolean fields the default is false, so we need to check
          // undefined directly.
          if (val['default'] !== undefined) {
            parsedConfig[key] = val['default'];
          } else {
            parsedConfig[key] = '';
          }
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
    var fakeStore = new Y.juju.charmworld.APIv2({});
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

  // Retrieve and return the config viewlet.
  var getViewlet = function(inspector) {
    return inspector.viewletManager.viewlets.config;
  };

  // Change the value of the given key in the constraints form.
  // Return the corresponding node.
  var changeForm = function(viewlet, key, value) {
    var selector = 'textarea[name=' + key + '].config-field';
    var node = viewlet.container.one(selector);
    node.set('value', value);
    // Trigger bindingEngine to notice change.
    var bindingEngine = inspector.viewletManager.bindingEngine;
    bindingEngine._nodeChanged(node, viewlet);
    return node;
  };

  it('properly renders a service without charm options', function() {
    // Mutate charmData before the render.
    delete charmData.charm.options;
    inspector = setUpInspector();
    // Verify the viewlet rendered, previously it would raise.
    assert.isObject(container.one('.config-file'));
    // Restore the test global
    charmData = utils.loadFixture('data/mediawiki-api-response.json', true);
  });

  it('properly renders charm options with booleans', function() {
    inspector = setUpInspector();
    // Verify the viewlet rendered, previously it would raise.
    assert.isObject(container.one('.config-file'));
    // Restore the test global
    charmData = utils.loadFixture('data/mediawiki-api-response.json', true);

    // Verify we find our checkbox Also note that it's hidden because we're
    // using the slider markup and styling for boolean fields.
    assert.equal(
        container.all('input.hidden-checkbox').size(),
        1,
        'did not render one boolean field');

    // Verify that the textual representation is there.
    assert.equal(
        container.all('.textvalue').size(),
        1,
        'can not find the textual value for the checkbox.');

    // And the value will toggle with the checkbox
    var debugContainer = container.one('.toggle-debug').get('parentNode');
    assert.equal(
        debugContainer.one('.textvalue').get('text').replace(/\s/g, ''),
        'false');
    debugContainer.one('label').simulate('click');
    assert.equal(
        debugContainer.one('.textvalue').get('text').replace(/\s/g, ''),
        'true');
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

  it('can destroy using a ghost model', function(done) {
    var inspector = setUpInspector({useGhost: true});
    assert(inspector.viewletManager.get('model').name, 'browser-charm');
    inspector.viewletManager.set('db', {
      services: {
        remove: function(model) {
          // This means that it successfully went down the proper path
          done();
        }
      }
    });
    inspector.initiateServiceDestroy();
  });

  /**** End service destroy UI tests. ****/

  it('saves changes to settings values', function() {
    inspector = setUpInspector();
    env.connect();
    var vmContainer = inspector.viewletManager.get('container'),
        input = vmContainer.one('textarea[name=admins]'),
        button = vmContainer.one('.configuration-buttons .confirm');

    assert.equal(db.services.item(0).get('config').admins, '');
    input.set('value', 'foo');
    // Force the databinding to notice the change in-line.
    inspector.viewletManager.bindingEngine._nodeChanged(
        input, inspector.viewletManager.viewlets.config);
    button.simulate('click');
    var message = env.ws.last_message();
    assert.equal('foo', message.Params.Config.admins);
    // Send back a success message.
    env.ws.msg({RequestId: message.RequestId});
    assert.equal(button.getHTML(), 'Save changes');
    assert.isTrue(input.hasClass('change-saved'));
  });

  it('can cancel changes', function() {
    // Set up.
    inspector = setUpInspector();
    env.connect();
    var viewlet = getViewlet(inspector);
    var node = viewlet.container.one('textarea[data-bind="config.admins"]');
    var parentNode = node.ancestor('.settings-wrapper');
    inspector.model.set('config', {admins: 'g:s'});
    changeForm(viewlet, 'admins', 'k:t');
    assert.equal(
        parentNode.all('.modified').size(),
        1,
        'did not find a modified node');
    // Act.
    viewlet.container.one('button.cancel').simulate('click');
    // Validate.
    assert.equal(node.get('value'), 'g:s');
    // No modified markers are shown.
    // Verify the form is updated.
    assert.equal(
        parentNode.all('.modified').size(),
        0,
        'found a modified node');
  });

  it('can cancel pending conflicts', function() {
    // Set up.
    inspector = setUpInspector();
    env.connect();
    var viewlet = getViewlet(inspector);
    var node = viewlet.container.one('textarea[name="admins"]');
    var parentNode = node.ancestor('.settings-wrapper');
    changeForm(viewlet, 'admins', 'k:t');
    inspector.model.set('config', {admins: 'g:s'});
    assert.equal(
        parentNode.all('[name=admins].conflict-pending').size(),
        1,
        'did not find a conflict-pending node');
    // Act.
    viewlet.container.one('button.cancel').simulate('click');
    // Validate.
    assert.equal(node.get('value'), 'g:s');
    // No conflict or modified markers are shown.
    assert.equal(
        parentNode.all('.modified').size(),
        0,
        'found a modified node');
    assert.equal(
        parentNode.all('.conflict-pending').size(),
        0,
        'found a conflict-pending node');
  });

  it('can cancel conflicts that are being resolved', function() {
    // Set up.
    inspector = setUpInspector();
    env.connect();
    var viewlet = getViewlet(inspector);
    var node = viewlet.container.one('textarea[name="admins"]');
    var parentNode = node.ancestor('.settings-wrapper');
    changeForm(viewlet, 'admins', 'k:t');
    inspector.model.set('config', {admins: 'g:s'});
    node.simulate('click');
    assert.equal(
        parentNode.all('[name=admins].conflict').size(),
        1,
        'did not find the conflict node');
    // Act.
    viewlet.container.one('button.cancel').simulate('click');
    // Validate.
    assert.equal(node.get('value'), 'g:s');
    // No conflict or modified markers are shown.
    assert.equal(
        parentNode.all('.modified').size(),
        0,
        'found a modified node');
    assert.equal(
        parentNode.all('.conflict-pending').size(),
        0,
        'found a conflict-pending node');
    assert.equal(
        parentNode.all('[name=admins].conflict').size(),
        0,
        'found the conflict node');
  });

});

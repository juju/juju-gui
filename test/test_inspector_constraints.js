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

describe('Inspector Constraints', function() {
  var container, env, inspector, juju, models, utils, view, views, Y, viewUtils;

  // Create a service model instance.
  var makeService = function(db) {
    var charmId = 'precise/django-42';
    db.charms.add({id: charmId, config: {}});
    var service = db.services.add({id: 'django', charm: charmId});
    db.onDelta({data: {result: [
      ['unit', 'add', {id: 'django/0', agent_state: 'pending'}]
    ]}});
    return service;
  };

  // Create a service inspector.
  var makeInspector = function(environmentView, service) {
    Y.Node.create('<div id="content">').appendTo(container);
    inspector = environmentView.createServiceInspector(service,
        {databinding: {interval: 0}});
    return inspector;
  };

  // Create a fake response from the juju-core API server.
  var makeResponse = function(service, error) {
    var response = {RequestId: 1};
    if (error) {
      response.Error = 'bad wolf';
    } else {
      response.Response = {};
    }
    return response;
  };

  // Retrieve and return the constraints viewlet.
  var getViewlet = function(inspector) {
    return inspector.views.constraints;
  };

  // Change the value of the given key in the constraints form.
  // Return the corresponding node.
  var changeForm = function(viewlet, key, value) {
    var selector = 'input[name=' + key + '].constraint-field';
    var node = viewlet.get('container').one(selector);
    node.set('value', value);
    // Trigger bindingEngine to notice change.
    var bindingEngine = inspector.bindingEngine;
    bindingEngine._nodeChanged(node, viewlet);
    return node;
  };

  before(function(done) {
    var requirements = ['juju-gui', 'juju-views',
      'node-event-simulate', 'juju-charm-models',
      'charmstore-api'];
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      utils = window.jujuTestUtils.utils;
      views = Y.namespace('juju.views');
      viewUtils = Y.namespace('juju.views.utils');
      done();
    });
  });

  beforeEach(function(done) {
    container = utils.makeContainer(this, 'container');
    var conn = new utils.SocketStub();
    var db = new models.Database();
    var service = makeService(db);
    var fakeStore = new Y.juju.charmstore.APIv4({});
    fakeStore.getIconPath = function() {
      return 'charm icon url';
    };
    env = new juju.environments.GoEnvironment({conn: conn});
    env.update_annotations = function() {};
    env.connect();
    view = new views.environment({
      container: container,
      db: db,
      env: env,
      charmstore: fakeStore
    });
    view.render();
    container.append(
        '<div id="bws-sidebar"><div class="bws-content"></div></div>');
    inspector = makeInspector(view, service);
    done();
  });

  afterEach(function(done) {
    delete view.inspector;
    view.destroy();
    env.after('destroy', function() { done(); });
    env.destroy();
  });

  it('renders the constraints form correctly', function() {
    assert.notEqual(
        0, env.genericConstraints.length, 'no generic constraints found');
    Y.Array.each(env.genericConstraints, function(key) {
      var node = container.one('input[name=' + key + '].constraint-field');
      assert.isNotNull(node, key + ' node not found');
    });
  });

  it('renders the values as empty strings when undefined', function() {
    inspector.get('model').set('constraints', {});
    Y.Array.each(env.genericConstraints, function(key) {
      var node = container.one('input[name=' + key + '].constraint-field');
      assert.strictEqual('', node.get('value'));
    });
  });

  it('renders the constraint titles correctly', function() {
    var constraintDescriptions = viewUtils.constraintDescriptions;

    Y.Array.each(env.genericConstraints, function(key) {
      var node = container.one('label[for=' + key + ']');
      var expectedTitle = constraintDescriptions[key].title;
      assert.strictEqual(expectedTitle, node.getHTML());
    });
  });

  it('renders initial service constraints', function() {
    var constraints = {arch: 'lcars', cpu: 'quantum'};
    inspector.get('model').set('constraints', constraints);
    inspector.render();
    Y.Object.each(constraints, function(value, key) {
      var node = container.one('input[name=' + key + '].constraint-field');
      assert.strictEqual(value, node.get('value'));
    });
  });

  it('binds service constraints', function() {
    Y.Array.each(env.genericConstraints, function(key) {
      var node = container.one('input[name=' + key + '].constraint-field');
      var expected = 'constraints.' + key;
      assert.strictEqual(expected, node.getData('bind'));
    });
  });

  it('can save constraints', function() {
    var expected = {arch: 'amd64', 'cpu-power': 100, mem: 4};
    // Change values in the form.
    Y.Object.each(expected, function(value, key) {
      var node = container.one('input[name=' + key + '].constraint-field');
      node.set('value', value);
    });
    // Save the changes.
    var saveButton = container.one('button.save-constraints');
    saveButton.simulate('click');
    var lastMessage = env.ws.last_message();
    // The set_constraint API method is correctly called.
    assert.equal('SetServiceConstraints', lastMessage.Request);
    // The expected constraints are passed in the API call.
    assert.deepEqual(expected, lastMessage.Params.Constraints);
  });

  it('handles error responses from the environment', function() {
    var saveButton = container.one('button.save-constraints');
    saveButton.simulate('click');
    env.ws.msg(makeResponse(inspector.get('model'), true));
    var db = inspector.get('db');
    // An error response generates a notification.
    assert.strictEqual(1, db.notifications.size());
    var msg = db.notifications.item(0);
    assert.strictEqual('error', msg.get('level'));
    assert.strictEqual('Error setting service constraints', msg.get('title'));
    var serviceName = inspector.get('model').get('id');
    assert.strictEqual('Service name: ' + serviceName, msg.get('message'));
  });

  it('handles success responses from the environment', function() {
    var viewlet = getViewlet(inspector);
    changeForm(viewlet, 'arch', 'i386');
    var saveButton = container.one('button.save-constraints');
    saveButton.simulate('click');
    env.ws.msg(makeResponse(inspector.get('model'), false));
    var input = container.one('input[name=arch].constraint-field');
    assert.isTrue(input.hasClass('change-saved'));
  });

  it('disables and re-enables the save button during the process', function() {
    var saveButton = container.one('button.save-constraints');
    assert.isFalse(saveButton.get('disabled'));
    saveButton.simulate('click');
    assert.isTrue(saveButton.get('disabled'));
    env.ws.msg(makeResponse(inspector.get('model')));
    assert.isFalse(saveButton.get('disabled'));
  });

  it('clears changed values on save', function() {
    var viewlet = getViewlet(inspector);
    changeForm(viewlet, 'arch', 'i386');
    assert.lengthOf(Object.keys(viewlet.changedValues), 1);
    var saveButton = container.one('button.save-constraints');
    assert.equal(saveButton.getHTML(), 'Confirm');
    saveButton.simulate('click');
    env.ws.msg(makeResponse(inspector.get('model'), false));
    assert.lengthOf(
        Object.keys(viewlet.changedValues),
        0,
        'changedValues is not empty after a save.');
    // There was an odd bug that caused this assertion to fail at one point.
    assert.equal(saveButton.getHTML(), 'Confirm');
  });

  it('shows and hides save controls appropriately', function() {
    var viewlet = getViewlet(inspector);
    var controls = container.one('.settings-constraints .controls');
    // Controls are hidden initially.
    assert.isTrue(controls.hasClass('closed'));
    // When the user changes a value, controls appear.
    changeForm(viewlet, 'arch', 'i386');
    assert.isFalse(controls.hasClass('closed'));
    // When the user manually changes back to an original value, controls
    // disappear.
    changeForm(viewlet, 'arch', '');
    assert.isTrue(controls.hasClass('closed'));
    // Controls reappear once again after making the change.
    changeForm(viewlet, 'arch', 'i386');
    assert.isFalse(controls.hasClass('closed'));
    // Saving the model will sync it, and the controls will disappear again.
    var saveButton = container.one('button.save-constraints');
    assert.equal(saveButton.getHTML(), 'Confirm');
    saveButton.simulate('click');
    env.ws.msg(makeResponse(inspector.get('model'), false));
    assert.isTrue(controls.hasClass('closed'));
  });

  it('can cancel changes', function() {
    // Set up.
    var viewlet = getViewlet(inspector);
    var node = viewlet.get('container')
                      .one('input[data-bind="constraints.arch"]');
    var parentNode = node.ancestor('.settings-wrapper');
    inspector.get('model').set('constraints', {arch: 'lcars'});
    changeForm(viewlet, 'arch', 'i386');
    assert.equal(
        parentNode.all('.modified').size(),
        1,
        'did not find a modified node');
    // Act.
    viewlet.get('container').one('button.cancel').simulate('click');
    // Validate.
    assert.equal(node.get('value'), 'lcars');
    // No modified markers are shown.
    // Verify the form is updated.
    assert.equal(
        parentNode.all('.modified').size(),
        0,
        'found a modified node');
  });

});

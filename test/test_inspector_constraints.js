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
  var container, env, inspector, juju, models, utils, view, views, Y;

  before(function(done) {
    var requirements = ['juju-gui', 'juju-tests-utils', 'juju-views',
      'node-event-simulate'];
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      window.flags = {serviceInspector: true};
      done();
    });
  });

  after(function() {
    delete window.flags;
  });

  beforeEach(function(done) {
    container = utils.makeContainer('container');
    var conn = new utils.SocketStub();
    var db = new models.Database();
    var service = makeService(db);
    env = juju.newEnvironment({conn: conn});
    env.connect();
    view = new views.environment({container: container, db: db, env: env});
    view.render();
    inspector = makeInspector(view, service);
    done();
  });

  afterEach(function(done) {
    view.setInspector(inspector, true);
    view.destroy();
    env.after('destroy', function() { done(); });
    env.destroy();
    container.remove(true);
  });

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
    environmentView.createServiceInspector(service, {});
    var inspector = view.getInspector(service.get('id'));
    inspector.inspector.bindingEngine.interval = 0;
    return inspector;
  };

  // Create a fake response from the API server.
  var makeResponse = function(service, error) {
    return {
      err: error,
      op: 'set_constraints',
      request_id: 1,
      service_name: service.get('id')
    };
  };

  // Retrieve and return the constraints viewlet.
  var getViewlet = function(inspector) {
    return inspector.inspector.viewlets.constraints;
  };

  // Change the value of the given key in the constraints form.
  // Return the corresponding node.
  var changeForm = function(viewlet, key, value) {
    var selector = 'input[name=' + key + '].constraint-field';
    var node = viewlet.container.one(selector);
    node.set('value', value);
    viewlet._changedValues = ['constraints.' + key];
    return node;
  };

  it('renders the constraints form correctly', function() {
    assert.notEqual(
        0, env.genericConstraints.length, 'no generic constraints found');
    Y.Array.each(env.genericConstraints, function(key) {
      var node = container.one('input[name=' + key + '].constraint-field');
      assert.isNotNull(node, key + ' node not found');
    });
  });

  it('renders the values as empty strings when undefined', function() {
    inspector.model.set('constraints', {});
    Y.Array.each(env.genericConstraints, function(key) {
      var node = container.one('input[name=' + key + '].constraint-field');
      assert.strictEqual('', node.get('value'));
    });
  });

  it('renders the constraint titles correctly', function() {
    var constraintDescriptions = getViewlet(inspector).constraintDescriptions;
    Y.Array.each(env.genericConstraints, function(key) {
      var node = container.one('div[for=' + key + '].control-label');
      var expectedTitle = constraintDescriptions[key].title;
      assert.strictEqual(expectedTitle, node.getContent());
    });
  });

  it('renders initial service constraints', function() {
    var constraints = {arch: 'lcars', cpu: 'quantum'};
    inspector.model.set('constraints', constraints);
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

  it('can resolve conflicts', function() {
    var newValue = 'amd64';
    var viewlet = getViewlet(inspector);
    // Change the value in the form.
    var node = changeForm(viewlet, 'arch', 'i386');
    // Change the value in the database.
    inspector.model.set('constraints', {arch: newValue});
    // Accept the incoming new value.
    var message = node.ancestor('.control-group').one('.conflicted');
    // The user is informed about the new value.
    assert.strictEqual(newValue, message.one('.newval').getContent());
    message.one('.conflicted-confirm').simulate('click');
    // The form value is changed accordingly.
    assert.strictEqual(newValue, node.get('value'));
  });

  it('can ignore conflicts', function() {
    var viewlet = getViewlet(inspector);
    // Change the value in the form.
    var node = changeForm(viewlet, 'arch', 'i386');
    // Change the value in the database.
    inspector.model.set('constraints', {arch: 'amd64'});
    // Ignore the incoming new value.
    var message = node.ancestor('.control-group').one('.conflicted');
    message.one('.conflicted-cancel').simulate('click');
    // The form value is preserved.
    assert.strictEqual('i386', node.get('value'));
  });

  it('avoids displaying the conflicts message if not required', function() {
    var viewlet = getViewlet(inspector);
    // Change the value in the form.
    var node = changeForm(viewlet, 'arch', 'i386');
    // Change the value in the database.
    inspector.model.set('constraints', {arch: 'i386'});
    var message = node.ancestor('.control-group').one('.conflicted');
    assert.strictEqual('', message.one('.newval').getContent());
  });

  it('can save constraints', function() {
    var expected = {arch: 'amd64', cpu: 'photon', mem: '1 teraflop'};
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
    assert.equal('set_constraints', lastMessage.op);
    // The expected constraints are passed in the API call.
    var obtained = Object.create(null);
    Y.Array.each(lastMessage.constraints, function(value) {
      var pair = value.split('=');
      obtained[pair[0]] = pair[1];
    });
    assert.deepEqual(expected, obtained);
  });

  it('handles error responses from the environment', function() {
    var saveButton = container.one('button.save-constraints');
    saveButton.simulate('click');
    env.ws.msg(makeResponse(inspector.model, true));
    var db = inspector.inspector.get('db');
    // An error response generates a notification.
    assert.strictEqual(1, db.notifications.size());
    var msg = db.notifications.item(0);
    assert.strictEqual('error', msg.get('level'));
    assert.strictEqual('Error setting service constraints', msg.get('title'));
    var serviceName = inspector.model.get('id');
    assert.strictEqual('Service name: ' + serviceName, msg.get('message'));
  });

  it('handles success responses from the environment', function() {
    var saveButton = container.one('button.save-constraints');
    saveButton.simulate('click');
    env.ws.msg(makeResponse(inspector.model, false));
    var db = inspector.inspector.get('db');
    // A success notification is correctly generated.
    assert.strictEqual(1, db.notifications.size());
    var msg = db.notifications.item(0);
    assert.strictEqual('info', msg.get('level'));
    assert.strictEqual('Constraints saved successfully', msg.get('title'));
  });

  it('disables and re-enables the save button during the process', function() {
    var saveButton = container.one('button.save-constraints');
    assert.isFalse(saveButton.get('disabled'));
    saveButton.simulate('click');
    assert.isTrue(saveButton.get('disabled'));
    env.ws.msg(makeResponse(inspector.model));
    assert.isFalse(saveButton.get('disabled'));
  });

  it('clears changed values on save', function() {
    var viewlet = getViewlet(inspector);
    changeForm(viewlet, 'arch', 'i386');
    var saveButton = container.one('button.save-constraints');
    saveButton.simulate('click');
    env.ws.msg(makeResponse(inspector.model, false));
    assert.lengthOf(viewlet._changedValues, 0, 'changedValues is not empty');
  });

});

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
    return view.getInspector(service.get('id'));
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

  it('allows resolving conflicts', function() {
    var viewlet = getViewlet(inspector);
    // Change the value in the form.
    var node = changeForm(viewlet, 'arch', 'i386');
    // Change the value in the database.
    inspector.model.set('constraints', {arch: 'amd64'});
    // Accept the incoming new value.
    var message = node.ancestor('.control-group').one('.conflicted');
    message.one('.conflicted-confirm').simulate('click');
    // The form value is changed accordingly.
    assert.strictEqual('amd64', node.get('value'));
  });

  it('allows ignoring conflicts', function() {
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

  it('allows saving constraints', function() {

  });

});

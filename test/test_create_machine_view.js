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


describe('create machine view', function() {
  var container, machine, models, utils, view, views, Y;
  var requirements = [
    'create-machine-view', 'event-simulate', 'juju-models', 'juju-tests-utils',
    'juju-views', 'node', 'node-event-simulate'];

  before(function(done) {
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'create-machine-view');
    view = new views.CreateMachineView({
      container: container,
      unit: {id: 'test/1'}
    }).render();
  });

  afterEach(function() {
    view.destroy();
    container.remove(true);
  });

  it('should apply the wrapping class to the container', function() {
    assert.equal(container.hasClass('create-machine-view'), true);
  });

  it('should clean up properly on destroy', function() {
    view.destroy();
    assert.equal(container.hasClass('create-machine-view'), false);
    assert.equal(container.getHTML(), '');
  });

  it('should handle the cancel action', function(done) {
    var cancelFired = false;
    var destroyStub = utils.makeStubMethod(view, 'destroy');
    this._cleanups.push(destroyStub.reset);
    view.on('cancelCreateMachine', function(e) {
      cancelFired = true;
      assert.equal(e.unit.id, 'test/1');
      done();
    });
    container.one('.cancel').simulate('click');
    assert.equal(destroyStub.calledOnce(), true,
        'the view should have been destroyed');
    assert.equal(cancelFired, true,
        'the event should have been fired');
  });

  it('should handle the create action', function(done) {
    var createFired = false;
    var constraints = {
      'cpu-power': '2',
      mem: '4',
      'root-disk': '7'
    };
    var constraintsStub = utils.makeStubMethod(view,
        '_getConstraints', constraints);
    this._cleanups.push(constraintsStub.reset);
    var destroyStub = utils.makeStubMethod(view, 'destroy');
    this._cleanups.push(destroyStub.reset);
    view.on('createMachine', function(e) {
      createFired = true;
      assert.equal(e.unit.id, 'test/1');
      assert.deepEqual(e.constraints, constraints);
      done();
    });
    container.one('.create').simulate('click');
    assert.equal(destroyStub.calledOnce(), true,
        'the view should have been destroyed');
    assert.equal(createFired, true,
        'the event should have been fired');
  });

  it('should do nothing if the container type is not selected', function() {
    var createFired = false;
    var constraintsStub = utils.makeStubMethod(view,
        '_getConstraints', {});
    this._cleanups.push(constraintsStub.reset);
    var destroyStub = utils.makeStubMethod(view, 'destroy');
    this._cleanups.push(destroyStub.reset);
    view.on('createMachine', function(e) {
      createFired = true;
    });
    view.set('parentId', '6');
    container.one('.create').simulate('click');
    assert.equal(destroyStub.calledOnce(), false,
        'the view should not have been destroyed');
    assert.equal(createFired, false,
        'the event should not have been fired');
  });

  it('allows creating supported containers', function() {
    view.set('supportedContainerTypes', [
      {label: 'LXC', value: 'lxc'},
      {label: 'VmWare', value: 'vmw'}
    ]);
    view.render();
    var options = container.all('.containers option:not([disabled])');
    assert.deepEqual(options.getContent(), ['LXC', 'VmWare']);
    assert.deepEqual(options.get('value'), ['lxc', 'vmw']);
  });
});

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

describe('machine view panel view', function() {
  var Y, container, machines, machine, models, utils, units, views, view, View,
      scaleUpView, scaleUpViewRender;

  function createViewNoUnits() {
    // Create a test-specific view that has no units to start
    return new View({
      container: container,
      db: {
        services: new models.ServiceList(),
        machines: machines,
        units: new models.ServiceUnitList()
      }
    });
  }

  before(function(done) {
    Y = YUI(GlobalConfig).use(['machine-view-panel',
                               'juju-models',
                               'juju-views',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'drop-target-view-extension',
                               'node'], function(Y) {

      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      View = views.MachineViewPanelView;
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'machine-view-panel');
    // setup machines
    machine = {
      id: 0,
      hardware: {
        disk: 1024,
        mem: 1024,
        cpuPower: 1024,
        cpuCores: 1
      }
    };
    machines = new models.MachineList();
    machines.add([machine]);
    // displayName is set on the machine object in the list; we also need to
    // set it on our standalone model.
    var displayName = machines.createDisplayName(machine.id);
    machine.displayName = displayName;
    // setup unplaced service units
    units = new models.ServiceUnitList();
    units.add([{id: 'test/1'}]);
    // add everything to the view
    view = new View({
      container: container,
      db: {
        services: new models.ServiceList(),
        machines: machines,
        units: units
      }
    });
  });

  afterEach(function() {
    view.destroy();
    machines.destroy();
    container.remove(true);
  });

  it('should apply the wrapping class to the container', function() {
    view.render();
    assert.equal(container.hasClass('machine-view-panel'), true);
  });

  it('should render the header widgets', function() {
    view.render();
    assert.equal(container.one('.column .head .title').get('text'),
        'Unplaced units');
  });

  it('should set the initial container header label', function() {
    var label = '0 containers, 0 units';
    view.render();
    assert.equal(view._containersHeader.get('label'), label);
    assert.equal(view._containersHeader.get(
        'container').one('.label').get('text'), label);
  });

  describe('_smartUpdateList', function() {
    // _smartUpdateList use two private methods, _addNewTOkens and
    // _removeOldTokens that do all the work--we can just test those.
    it('can determine if a model is new and needs token', function() {
      var models = [{id: 1}];
      var newTokens = view._addNewTokens(models, [], function(model) {
        return Y.Node.create('<li/>');
      });
      assert.equal(
          newTokens.length, 1,
          'Did not received expected number of tokens');
      assert.equal(
          newTokens[0].getData('exists'), true,
          'New element not marked with "exists"');
    });

    it('can determine if a model already has a token', function() {
      var models = [{id: 1}],
          element = Y.Node.create('<li data-id="1"></li>');
      var newTokens = view._addNewTokens(models, [element], function(model) {
        return Y.Node.create('<li/>');
      });
      assert.equal(
          newTokens.length, 0,
          'Received tokens when no new tokens should have been created');
      assert.equal(
          element.getData('exists'), true,
          'Element not marked with "exists"');
    });

    it('can determine if a token has no model and remove it', function() {
      container.append(Y.Node.create('<li></li>'));
      var models = [{id: 1}],
          elements = container.all('li');
      assert.equal(elements.size(), 1);
      view._removeOldTokens(models, elements);
      assert.equal(container.all('li').size(), 0, 'Element not removed.');
    });

    it('can determine if there are no models and clear nodes', function() {
      container.append(Y.Node.create('<li></li>'));
      var models = [],
          elements = container.all('li');
      // Make sure the element has "exists" so we test the models condition.
      elements.each(function(element) {
        element.setData('exists', true);
      });
      assert.equal(elements.size(), 1);
      view._removeOldTokens(models, elements);
      assert.equal(container.all('li').size(), 0, 'Element not removed.');
    });

    it('calls a cleanup function if an "active" token is removed', function() {
      container.append(Y.Node.create('<li><span class="token active"/></li>'));
      var models = [{id: 1}],
          elements = container.all('li'),
          cleanup = false;
      assert.equal(elements.size(), 1);
      var cleanupFn = function() {
        cleanup = true;
      };
      view._removeOldTokens(models, elements, cleanupFn);
      assert.equal(cleanup, true, 'Cleanup function not called.');
    });

    it('calls a cleanup function if there are no models', function() {
      container.append(Y.Node.create('<li></li>'));
      var models = [],
          elements = container.all('li'),
          cleanup = false;
      // Make sure the element has "exists" so we test the models condition.
      elements.each(function(element) {
        element.setData('exists', true);
      });
      var cleanupFn = function() {
        cleanup = true;
      };
      view._removeOldTokens(models, elements, cleanupFn);
      assert.equal(cleanup, true, 'Cleanup function not called.');
    });
  });

  describe('token drag and drop', function() {
    beforeEach(function() {
      view.set('env', {
        addMachines: utils.makeStubFunction({ id: 'foo' }),
        placeUnit: utils.makeStubFunction()
      });
    });

    it('listens for the drag start, end, drop events', function() {
      var onStub = utils.makeStubMethod(view, 'on');
      this._cleanups.push(onStub.reset);
      view._bindEvents();
      assert.equal(onStub.callCount(), 3);
      var onStubArgs = onStub.allArguments();
      assert.equal(onStubArgs[0][0], '*:unit-token-drag-start');
      assert.deepEqual(onStubArgs[0][1], view._showDraggingUI);
      assert.equal(onStubArgs[1][0], '*:unit-token-drag-end');
      assert.deepEqual(onStubArgs[1][1], view._hideDraggingUI);
      assert.equal(onStubArgs[2][0], '*:unit-token-drop');
      assert.deepEqual(onStubArgs[2][1], view._unitTokenDropHandler);
    });

    it('converts the headers to drop targets when dragging', function() {
      // This tests assumes the previous test passed.
      // 'listens for the drag start, end, drop events'
      var onStub = utils.makeStubMethod(view, 'on');
      this._cleanups.push(onStub.reset);
      view._bindEvents();
      view._machinesHeader = { setDroppable: utils.makeStubFunction() };
      view._containersHeader = { setDroppable: utils.makeStubFunction() };
      // unit-drag start handler _showDraggingUI
      onStub.allArguments()[0][1].call(view);
      assert.equal(view._machinesHeader.setDroppable.calledOnce(), true);
      // The user hasn't selected a machine so this header should not be
      // a drop target.
      assert.equal(view._containersHeader.setDroppable.calledOnce(), false);
    });

    it('converts headers to drop targets when machine selected', function() {
      // This tests assumes the previous test passed.
      // 'listens for the drag start, end, drop events'
      var onStub = utils.makeStubMethod(view, 'on');
      this._cleanups.push(onStub.reset);
      view._bindEvents();
      view._machinesHeader = { setDroppable: utils.makeStubFunction() };
      view._containersHeader = { setDroppable: utils.makeStubFunction() };
      view.set('selectedMachine', 1);
      // unit-drag start handler _showDraggingUI
      onStub.allArguments()[0][1].call(view);
      assert.equal(view._machinesHeader.setDroppable.calledOnce(), true);
      // The user selected a machine so this header should be a drop target.
      assert.equal(view._containersHeader.setDroppable.calledOnce(), true);
    });

    it('converts headers to non-drop targets when drag stopped', function() {
      // This tests assumes the previous test passed.
      // 'listens for the drag start, end, drop events'
      var onStub = utils.makeStubMethod(view, 'on');
      this._cleanups.push(onStub.reset);
      view._bindEvents();
      view._machinesHeader = { setNotDroppable: utils.makeStubFunction() };
      view._containersHeader = { setNotDroppable: utils.makeStubFunction() };
      // unit-drag end handler _hideDraggingUI
      onStub.allArguments()[1][1].call(view);
      assert.equal(view._machinesHeader.setNotDroppable.calledOnce(), true);
      assert.equal(view._containersHeader.setNotDroppable.calledOnce(), true);
    });

    it('creates a new machine when dropped on machine header', function() {
      view._unitTokenDropHandler({
        dropAction: 'machine'
      });
      var env = view.get('env');
      assert.deepEqual(env.addMachines.lastArguments()[0], [{
        containerType: undefined,
        parentId: undefined
      }]);
      var placeArgs = env.placeUnit.lastArguments();
      assert.strictEqual(placeArgs[0], null);
      assert.equal(placeArgs[1], 'foo');
    });

    it('creates new container when dropped on container header', function() {
      view.set('selectedMachine', '5');
      view._unitTokenDropHandler({
        dropAction: 'container'
      });
      var env = view.get('env');
      assert.deepEqual(env.addMachines.lastArguments()[0], [{
        containerType: 'lxc',
        parentId: '5'
      }]);
      var placeArgs = env.placeUnit.lastArguments();
      assert.strictEqual(placeArgs[0], null);
      assert.equal(placeArgs[1], 'foo');
    });

    it('creates a new container when dropped on a machine', function() {
      view._unitTokenDropHandler({
        dropAction: 'container',
        targetId: '0'
      });
      var env = view.get('env');
      assert.deepEqual(env.addMachines.lastArguments()[0], [{
        containerType: 'lxc',
        parentId: '0'
      }]);
      var placeArgs = env.placeUnit.lastArguments();
      assert.strictEqual(placeArgs[0], null);
      assert.equal(placeArgs[1], 'foo');
    });

    it('places the unit on an already existing container', function() {
      view._unitTokenDropHandler({
        dropAction: 'container',
        targetId: '0/lxc/1'
      });
      var env = view.get('env');
      // The machine is already created so we don't need to create a new one.
      assert.equal(env.addMachines.callCount(), 0);
      var placeArgs = env.placeUnit.lastArguments();
      assert.strictEqual(placeArgs[0], null);
      assert.equal(placeArgs[1], '0/lxc/1');
    });
  });

  describe('unplaced units column', function() {
    it('should render a list of units', function() {
      view.render();
      var list = container.all('.unplaced .content li');
      assert.equal(list.size(), units.size(),
                   'models are out of sync with displayed list');
      list.each(function(item, index) {
        var u = units.item(index),
            id = item.getAttribute('data-id');
        assert.equal(id, u.id, 'displayed item does not match model');
      });
    });

    it('displays a message when there are no unplaced units', function() {
      var view = createViewNoUnits();
      view.render();
      var message = view.get('container').one('.column.unplaced .all-placed');
      assert.equal(message.getStyle('display'), 'block');
    });

    it('doesn\'t show a message when there are no unplaced units', function() {
      view.render();
      var message = view.get('container').one('.column.unplaced .all-placed');
      assert.equal(message.getStyle('display'), 'none');
    });

    it('should add new tokens when units are added', function() {
      view.render();
      var selector = '.unplaced .content li',
          list = container.all(selector),
          id = 'test/2';
      assert.equal(list.size(), units.size(),
                   'initial displayed list is out of sync with unplaced units');
      units.add([{ id: id }]);
      list = container.all(selector);
      assert.equal(list.size(), units.size(),
                   'final displayed list is out of sync with unplaced units');
      var addedItem = container.one(selector + '[data-id="' + id + '"]');
      assert.notEqual(addedItem, null,
                      'unable to find added unit in the displayed list');
    });

    it('should remove tokens when units are deleted', function() {
      view.render();
      var selector = '.unplaced .content li',
          list = container.all(selector);
      assert.equal(list.size(), units.size(),
                   'initial displayed list is out of sync with unplaced units');
      units.remove(0);
      list = container.all(selector);
      assert.equal(list.size(), units.size(),
                   'final displayed list is out of sync with unplaced units');
      var deletedSelector = selector + '[data-id="test/1"]';
      var deletedItem = container.one(deletedSelector);
      assert.equal(deletedItem, null,
                   'found the deleted unit still in the list');
    });

    it('should re-render token when a unit is updated', function() {
      view.render();
      var id = 'test/3',
          unitModel = units.revive(0),
          selector = '.unplaced .content li',
          item = container.one(
              selector + '[data-id="' + unitModel.get('id') + '"]');
      assert.notEqual(item, null, 'unit was not initially displayed');
      unitModel.set('id', id);
      item = container.one(selector + '[data-id="' + id + '"]');
      assert.notEqual(item, null, 'unit was not displayed post-update');
    });

    it('update a machine when a new unit is assigned to it', function() {
      view.render();
      var updateStub = utils.makeStubMethod(view, '_updateMachine'),
          unitModel = units.revive(0),
          machineId = '0';
      this._cleanups.push(updateStub.reset);
      unitModel.set('machine', machineId);
      assert.equal(updateStub.calledOnce(), true);
      var updateArgs = updateStub.lastArguments();
      assert.equal(updateArgs[0], machineId);
    });

  });


  describe('machine column', function() {
    it('should render a list of machines', function() {
      view.render();
      var list = container.all('.machines .content li');
      assert.equal(list.size(), machines.size(),
                   'models are out of sync with displayed list');
      list.each(function(item, index) {
        var m = machines.item(index);
        assert.equal(item.one('.title').get('text'), m.displayName,
                     'displayed item does not match model');
      });
    });

    it('should set the correct machine count in the header', function() {
      var label = '1 machine';
      view.render();
      assert.equal(view._machinesHeader.get('label'), label);
      assert.equal(view._machinesHeader.get(
          'container').one('.label').get('text'), label);
    });
    /// XXX Jeff May 15 2014 - drop handlers no longer update UI. Fix once
    // handlers update the UI.
    it.skip('updates and re-renders a specific machine', function() {
      view.render();
      var node = container.one('.machines .content li');
      assert.equal(node.all('.service-icons .unit').size(),
                   machine.units.length, 'not all units have icons');
      machine.units = [
        {service: 'test1', icon: 'test1.svg'},
        {service: 'test2', icon: 'test2.svg'}
      ];
      view._updateMachine(machine);
      assert.equal(node.all('.service-icons .unit').size(),
                   machine.units.length, 'icons not updated along with units');
    });
    /// XXX Jeff May 15 2014 - drop handlers no longer update UI. Fix once
    // handlers update the UI.
    it.skip('should add new tokens when machines are added', function() {
      view.render();
      var selector = '.machines .content li',
          list = container.all(selector),
          id = 1;
      assert.equal(list.size(), machines.size(),
                   'initial displayed list is out of sync with machines');
      machines.add([{
        id: id,
        parentId: null,
        hardware: {
          disk: 1024,
          mem: 1024,
          cpuPower: 1024,
          cpuCores: 1
        }
      }]);
      list = container.all(selector);
      assert.equal(list.size(), machines.size(),
                   'final displayed list is out of sync with machines');
      var addedItem = container.one(selector + '[data-id="' + id + '"]');
      assert.notEqual(addedItem, null,
                      'unable to find added machine in the displayed list');
    });

    it('should remove tokens when machines are deleted', function() {
      view.render();
      var selector = '.machines .content li',
          list = container.all(selector);
      assert.equal(list.size(), machines.size(),
                   'initial displayed list is out of sync with machines');
      machines.remove(0);
      list = container.all(selector);
      assert.equal(list.size(), machines.size(),
                   'final displayed list is out of sync with machines');
      var deletedSelector = selector + '[data-id="' + machine.id + '"]';
      var deletedItem = container.one(deletedSelector);
      assert.equal(deletedItem, null,
                   'found the deleted machine still in the list');
    });

    /// XXX Jeff May 15 2014 - drop handlers no longer update UI. Fix once
    // handlers update the UI.
    it.skip('should re-render token when machine is updated', function() {
      view.render();
      var id = 999,
          machineModel = machines.revive(0),
          selector = '.machines .content li',
          item = container.one(
              selector + '[data-id="' + machineModel.get('id') + '"]');
      assert.notEqual(item, null, 'machine was not initially displayed');
      assert.equal(
          item.one('.title').get('text'), machineModel.get('displayName'),
          'initial machine names do not match');
      machineModel.set('id', id);
      item = container.one(selector + '[data-id="' + id + '"]');
      assert.notEqual(item, null, 'machine was not displayed post-update');
      assert.equal(
          item.one('.title').get('text'), machineModel.get('displayName'),
          'machine names do not match post-update');
    });

    it('should set the correct counts in the container header', function(done) {
      var label = '2 containers, 1 unit';
      view.render();
      var machineToken = container.one('.machines li .token');
      machines.add([
        {id: '0/lxc/1'},
        {id: '0/lxc/2'}
      ]);
      // Add a unit to the machine.
      view.get('db').units.add([{id: 'test/2', machine: '0'}]);
      machineToken.on('click', function(e) {
        // Need to explicitly fire the click handler as we are catching
        // the click event before it can be fired.
        view.handleMachineTokenSelect(e);
        assert.equal(view._containersHeader.get('label'), label);
        assert.equal(view._containersHeader.get(
            'container').one('.label').get('text'), label);
        done();
      });
      machineToken.simulate('click');
    });

    it('should select a token when clicked', function() {
      view.render();
      machines.add([
        {id: '0/lxc/1'}
      ]);
      // Click on a machine so that we have a list of containers.
      container.one('.machines li .token').simulate('click');
      // Now select a container.
      var containerToken = container.one('.containers li .token');
      containerToken.simulate('click');
      assert.equal(containerToken.hasClass('active'), true);
    });

    it('should annotate units with icons for its tokens', function() {
      var db = view.get('db'),
          unit = {id: 'foo/0', service: 'foo' };
      db.services.add({ id: 'foo', icon: 'http://example.com/foo.png' });
      unit = view._addIconsToUnits([unit])[0];
      assert.equal(unit.icon, 'http://example.com/foo.png');
    });

    it('should log an error when it cannot find the service', function() {
      var unit = {id: 'foo/0', service: 'foo' },
          errorStub = utils.makeStubMethod(console, 'error');
      this._cleanups.push(errorStub.reset);
      unit = view._addIconsToUnits([unit])[0];
      assert.equal(errorStub.calledOnce(), true);
      assert.equal(errorStub.lastArguments(), 'Unit foo/0 has no service.');
    });
  });

  describe('container column', function() {
    it('creates container tokens without units', function() {
      var updateStub = utils.makeStubMethod(
          view, '_updateMachineWithUnitData');
      this._cleanups.push(updateStub.reset);
      var db = view.get('db'),
          filterStub = utils.makeStubMethod(db.units, 'filterByMachine');
      this._cleanups.push(filterStub.reset);
      var rendered = false,
          target;
      var viewStub = utils.makeStubMethod(views, 'ContainerToken', {
        render: function() { rendered = true; },
        addTarget: function(t) { target = t; }
      });
      var containerParent = utils.makeContainer(this, 'machine-view-panel'),
          container = {};
      view._createContainerToken(containerParent, container);
      // Verify that units for the container were looked up since they weren't
      // provided
      assert.equal(filterStub.calledOnce(), true);
      assert.equal(updateStub.calledOnce(), true);
      assert.equal(viewStub.calledOnce(), true);
      // Verify token is rendered and has the view added as a target.
      assert.equal(rendered, true);
      assert.equal(target, view);
    });

    it('creates container tokens with units', function() {
      var updateStub = utils.makeStubMethod(view, '_updateMachineWithUnitData');
      this._cleanups.push(updateStub.reset);
      var db = view.get('db'),
          filterStub = utils.makeStubMethod(db.units, 'filterByMachine');
      this._cleanups.push(filterStub.reset);
      var rendered = false,
          target;
      var viewStub = utils.makeStubMethod(views, 'ContainerToken', {
        render: function() { rendered = true; },
        addTarget: function(t) { target = t; }
      });
      var containerParent = utils.makeContainer(this, 'machine-view-panel'),
          units = [{}],
          container = {};
      view._createContainerToken(containerParent, container, units);
      // Verify that units for the container were provided, and not looked up.
      assert.equal(filterStub.calledOnce(), false);
      assert.equal(updateStub.calledOnce(), true);
      assert.equal(viewStub.calledOnce(), true);
      // Verify token is rendered and has the view added as a target.
      assert.equal(rendered, true);
      assert.equal(target, view);
    });

    it('creates container tokens when a machine is selected', function() {
      view.render();
      var target = container.one('.machines li .token');
      target.setData('id', '0');
      var mockEvent = {
        currentTarget: target,
        preventDefault: function() {}
      };
      machines.add([{ id: '0/lxc/0' }]);
      var renderStub = utils.makeStubMethod(view, '_renderContainerTokens');
      this._cleanups.push(renderStub.reset);
      view.handleMachineTokenSelect(mockEvent);
      assert.equal(renderStub.calledOnce(), true);
      var lastArgs = renderStub.lastArguments();
      assert.equal(lastArgs[0][0].displayName, '0/lxc/0');
      assert.equal(lastArgs[1], '0');
    });

    it('creates tokens for containers and "bare metal"', function() {
      view.render();
      machines.add([{ id: '0/lxc/0' }]);
      var containers = machines.filterByParent('0');
      var tokenStub = utils.makeStubMethod(view, '_createContainerToken');
      this._cleanups.push(tokenStub.reset);
      view._renderContainerTokens(containers, 0);
      assert.equal(tokenStub.callCount(), 2);
      var tokenArguments = tokenStub.allArguments();
      assert.equal(tokenArguments[0][1].displayName, '0/lxc/0');
      assert.equal(tokenArguments[1][1].displayName, 'Bare metal');
    });

    it('always creates a "bare metal" token', function() {
      view.render();
      var tokenStub = utils.makeStubMethod(view, '_createContainerToken');
      this._cleanups.push(tokenStub.reset);
      view._renderContainerTokens([], 0);
      assert.equal(tokenStub.callCount(), 1);
      var tokenArguments = tokenStub.allArguments();
      assert.equal(tokenArguments[0][1].displayName, 'Bare metal');
    });
  });

  describe('mass scale up UI', function() {
    it('should render the scale up UI', function() {
      view.render();
      assert.equal(container.one(
          '.column.unplaced .scale-up .action-block span').get('text'),
          'Choose a service and add units');
    });

    it('should render the mass scale up UI', function() {
      var detachStub = utils.makeStubFunction();
      var onStub = utils.makeStubFunction({ detach: detachStub });
      var destroyStub = utils.makeStubFunction();
      scaleUpViewRender = utils.makeStubFunction({
        on: onStub,
        destroy: destroyStub
      });
      scaleUpView = utils.makeStubMethod(views, 'ServiceScaleUpView', {
        render: scaleUpViewRender
      });
      this._cleanups.push(scaleUpView.reset);
      view.render();
      assert.equal(scaleUpView.calledOnce(), true);
      assert.equal(scaleUpViewRender.calledOnce(), true);
      assert.equal(onStub.callCount(), 3);
      var onArgs = onStub.lastArguments();
      assert.equal(onArgs[0], 'listClosed');
    });

    it('properly destroys the scale up view up on destroy', function() {
      var detachStub = utils.makeStubFunction();
      var onStub = utils.makeStubFunction({ detach: detachStub });
      var destroyStub = utils.makeStubFunction();
      scaleUpViewRender = utils.makeStubFunction({
        on: onStub,
        destroy: destroyStub
      });
      scaleUpView = utils.makeStubMethod(views, 'ServiceScaleUpView', {
        render: scaleUpViewRender
      });
      this._cleanups.push(scaleUpView.reset);
      view.render();
      view.destroy();
      assert.equal(detachStub.callCount(), 3);
      assert.equal(destroyStub.callCount(), 1);
    });

    it('listens to addUnit event and calls env.add_unit', function(done) {
      view.render();
      view.set('env', {
        add_unit: utils.makeStubFunction()
      });
      var addUnitEvent = {
        serviceName: 'foo',
        unitCount: '10'
      };
      view._scaleUpView.after('addUnit', function() {
        var addUnit = view.get('env').add_unit;
        assert.equal(addUnit.callCount(), 1);
        var addUnitArgs = addUnit.lastArguments();
        assert.equal(addUnitArgs[0], addUnitEvent.serviceName);
        assert.equal(addUnitArgs[1], addUnitEvent.unitCount);
        done();
      });
      view._scaleUpView.fire('addUnit', addUnitEvent);
    });

    it('hides the "all placed" message when the service list is displayed',
        function() {
          var view = createViewNoUnits();
          view.render();
          // The message should be display initially.
          var message = view.get('container').one(
              '.column.unplaced .all-placed');
          assert.equal(message.getStyle('display'), 'block');
          // Click the button to open the panel and the message should
          // be hidden.
          container.one('.scale-up button.closed').simulate('click');
          message = view.get('container').one('.column.unplaced .all-placed');
          assert.equal(message.getStyle('display'), 'none');
        });

    it('shows the "all placed" message when the service list is closed',
        function() {
          var view = createViewNoUnits();
          view.render();
          // Click the button to open the panel and the message should
          // be hidden.
          container.one('.scale-up button.closed').simulate('click');
          var message = view.get('container').one(
              '.column.unplaced .all-placed');
          assert.equal(message.getStyle('display'), 'none');
          // Close the panel and the message should displayed again.
          container.one('.scale-up button.opened').simulate('click');
          message = view.get('container').one('.column.unplaced .all-placed');
          assert.equal(message.getStyle('display'), 'block');
        });
  });
});

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

  describe('machines column', function() {
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

    it('should add new tokens when machines are added', function() {
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

    it('should re-render token when machine is updated', function() {
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

    it('should render a list of containers', function(done) {
      view.render();
      var machineToken = container.one('.machines li .token');
      machines.add([
        {id: '0/lxc/1'},
        {id: '0/lxc/2'}
      ]);
      machineToken.on('click', function(e) {
        // Need to explicitly fire the click handler as we are catching
        // the click event before it can be fired.
        view.handleMachineTokenSelect(e);
        var containers = machines.filterByParent('0'),
            list = container.all('.containers .content li');
        assert.equal(containers.length > 0, true,
            'There are no initial containers');
        assert.equal(list.size(), containers.length,
            'models are out of sync with displayed list');
        list.each(function(item, index) {
          var machines = containers[index];
          assert.equal(item.one('.title').get('text'), machines.displayName,
              'displayed item does not match model');
        });
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

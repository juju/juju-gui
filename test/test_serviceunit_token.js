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

describe('Service unit token', function() {
  var container, utils, models, views, view, id, title, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-serviceunit-token',
                               'juju-models',
                               'juju-tests-utils',
                               'node-event-simulate'], function(Y) {
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
    var unit = {
      id: 'test/0',
      displayName: 'test'
    };
    var units = new models.ServiceUnitList();
    units.add([unit]);
    id = 'test/0';
    title = 'test';
    view = new views.ServiceUnitToken({
      container: container,
      unit: unit,
      db: {
        machines: new models.MachineList(),
        units: units
      },
      env: {
        addMachines: utils.makeStubFunction({id: '7'}),
        placeUnit: utils.makeStubFunction()
      }
    }).render();
    view.get('db').machines.add([{id: '0'}, {id: '0/lxc/12'}]);
  });

  afterEach(function() {
    view.destroy();
  });

  it('renders to initial, undeployed state', function() {
    var selector = '.unplaced-unit';
    assert.notEqual(container.one(selector), null,
                    'DOM element not found');
    assert.equal(container.one(selector + ' .title').get('text').trim(),
                 title, 'display names do not match');
    assert.equal(container.hasClass('state-initial'), true);
  });

  it('makes itself draggable on render', function() {
    assert.equal(view.get('container').getAttribute('draggable'), 'true');
  });

  it('adds the unit id to the drag data', function() {
    var handler = view._makeDragStartHandler({unit: { id: 'foo' }});
    var dragData = {
      _event: {
        dataTransfer: {
          setData: utils.makeStubFunction()
        },
        stopPropagation: utils.makeStubFunction() }};
    handler.call(view, dragData);
    var dragEvent = dragData._event;
    assert.equal(dragEvent.stopPropagation.calledOnce(), true);
    assert.equal(dragEvent.dataTransfer.setData.calledOnce(), true);
    var setArgs = dragEvent.dataTransfer.setData.lastArguments();
    assert.equal(setArgs[0], 'Text');
    assert.equal(setArgs[1], '{"id":"foo"}');
  });

  it('can show the machine selection', function() {
    // Show the machine selection.
    view.showMoreMenu();
    container.one('li').simulate('click');
    assert.equal(container.hasClass('state-select-machine'), true);
  });

  it('can populate the machines selection', function() {
    var machinesSelect = container.one('.machines select');
    assert.equal(machinesSelect.all('option').size(), 2,
        'The defaults should exist');
    // Show the machine selection.
    view.showMoreMenu();
    container.one('li').simulate('click');
    var machineOptions = machinesSelect.all('option');
    assert.equal(machineOptions.size(), 3);
    assert.equal(machineOptions.item(2).get('value'), '0');
  });

  it('orders the machines list correctly', function() {
    view.get('db').machines.add([{id: '2'}, {id: '1'}]);
    // Show the machine selection.
    view.showMoreMenu();
    container.one('li').simulate('click');
    var machineOptions = container.one('.machines select').all('option');
    assert.equal(machineOptions.item(2).get('value'), '0');
    assert.equal(machineOptions.item(3).get('value'), '1');
    assert.equal(machineOptions.item(4).get('value'), '2');
  });

  it('can show the new machine form', function() {
    var machinesSelect = container.one('.machines select');
    // Select the 'New machine' option.
    machinesSelect.set('selectedIndex', 1);
    machinesSelect.simulate('change');
    assert.equal(container.hasClass('state-new-machine'), true);
  });

  it('can show the container selection', function() {
    // Select a machine option.
    container.one('.machines select').simulate('change');
    assert.equal(container.hasClass('state-select-container'), true);
  });

  it('can populate the containers selection', function() {
    var containersSelect = container.one('.containers select');
    var selectedMachineStub = utils.makeStubMethod(view,
        '_getSelectedMachine', '0');
    this._cleanups.push(selectedMachineStub.reset);
    assert.equal(containersSelect.all('option').size(), 3,
        'The defaults should exist');
    // Select a machine option.
    container.one('.machines select').simulate('change');
    var containerOptions = containersSelect.all('option');
    assert.equal(containerOptions.size(), 5,
                 'unexpected number of containers present');
    assert.equal(containerOptions.item(2).get('value'), '0/lxc/12',
                 'unexpected container value in list');
    // Check the "Choose location" item is still at the top of the list.
    assert.equal(containerOptions.item(0).get('text').trim(),
        'Choose container type…', 'default container text incorrect');
    // Check the root container option is the second item.
    assert.equal(containerOptions.item(1).get('value'), 'root-container',
                 'root container value is not the second option');
    assert.equal(containerOptions.item(1).get('text'), '0/root container',
                 'root container text is not the second option');
  });

  it('orders the containers list correctly', function() {
    var selectedMachineStub = utils.makeStubMethod(view,
        '_getSelectedMachine', '0');
    this._cleanups.push(selectedMachineStub.reset);
    view.get('db').machines.add([
      {id: '0/lxc/1'},
      {id: '0/lxc/3'}
    ]);
    // Select a machine option.
    container.one('.machines select').simulate('change');
    var containerOptions = container.one('.containers select').all('option');
    assert.equal(containerOptions.item(2).get('value'), '0/lxc/1');
    assert.equal(containerOptions.item(3).get('value'), '0/lxc/3');
    assert.equal(containerOptions.item(4).get('value'), '0/lxc/12');
  });

  it('shows the constraints for a new kvm container', function() {
    var containersSelect = container.one('.containers select');
    // Select the kvm option.
    containersSelect.set('selectedIndex', 2);
    containersSelect.simulate('change');
    assert.equal(container.hasClass('state-kvm'), true);
  });

  it('does not show the constraints for non kvm containers', function() {
    var containersSelect = container.one('.containers select');
    // Select a non kvm option.
    containersSelect.set('selectedIndex', 1);
    containersSelect.simulate('change');
    assert.equal(container.hasClass('state-select-container'), true);
  });

  it('resets the token on cancel', function() {
    var machinesSelect = container.one('.machines select');
    // Show the machine selection.
    view.showMoreMenu();
    container.one('li').simulate('click');
    // Select the 'New machine' option.
    machinesSelect.set('selectedIndex', 1);
    machinesSelect.simulate('change');
    // Cancel the move.
    container.one('.actions .cancel').simulate('click');
    assert.equal(container.hasClass('state-initial'), true);
  });

  it('fires an event when the unit should be moved', function(done) {
    var selectedMachineStub = utils.makeStubMethod(view,
        '_getSelectedMachine', '0');
    this._cleanups.push(selectedMachineStub.reset);
    var selectedContainerStub = utils.makeStubMethod(view,
        '_getSelectedContainer', '0/lxc/12');
    this._cleanups.push(selectedContainerStub.reset);
    view.on('moveToken', function(e) {
      assert.equal(e.unit, view.get('unit'));
      assert.equal(e.machine, '0');
      assert.equal(e.container, '0/lxc/12');
      assert.deepEqual(e.constraints, {});
      done();
    });
    // Move the unit.
    container.one('.actions .move').simulate('click');
  });

  it('does not fire an event when a container is not selected', function() {
    var moveFired = false;
    var selectedMachineStub = utils.makeStubMethod(view,
        '_getSelectedMachine', '0');
    this._cleanups.push(selectedMachineStub.reset);
    var selectedContainerStub = utils.makeStubMethod(view,
        '_getSelectedContainer', '');
    this._cleanups.push(selectedContainerStub.reset);
    view.on('moveToken', function(e) {
      moveFired = true;
    });
    // Move the unit.
    container.one('.actions .move').simulate('click');
    assert.equal(moveFired, false);
  });

  it('can create a machine with constraints', function(done) {
    var constraints = {
      'cpu-power': '2',
      mem: '4',
      'root-disk': '7'
    };
    var selectedMachineStub = utils.makeStubMethod(view,
        '_getSelectedMachine', 'new');
    this._cleanups.push(selectedMachineStub.reset);
    var selectedContainerStub = utils.makeStubMethod(view,
        '_getSelectedContainer', '');
    this._cleanups.push(selectedContainerStub.reset);
    var constraintsStub = utils.makeStubMethod(view,
        '_getConstraints', constraints);
    this._cleanups.push(constraintsStub.reset);
    view.on('moveToken', function(e) {
      assert.equal(e.unit, view.get('unit'));
      assert.equal(e.machine, 'new');
      assert.equal(e.container, '');
      assert.deepEqual(e.constraints, constraints);
      done();
    });
    // Move the unit.
    container.one('.actions .move').simulate('click');
  });

  it('can create a kvm container with constraints', function(done) {
    var constraints = {
      'cpu-power': '2',
      mem: '4',
      'root-disk': '7'
    };
    var selectedMachineStub = utils.makeStubMethod(view,
        '_getSelectedMachine', '0');
    this._cleanups.push(selectedMachineStub.reset);
    var selectedContainerStub = utils.makeStubMethod(view,
        '_getSelectedContainer', 'kvm');
    this._cleanups.push(selectedContainerStub.reset);
    var constraintsStub = utils.makeStubMethod(view,
        '_getConstraints', constraints);
    this._cleanups.push(constraintsStub.reset);
    view.on('moveToken', function(e) {
      assert.equal(e.unit, view.get('unit'));
      assert.equal(e.machine, '0');
      assert.equal(e.container, 'kvm');
      assert.deepEqual(e.constraints, constraints);
      done();
    });
    // Move the unit.
    container.one('.actions .move').simulate('click');
  });

  it('does not pass constraints to new lxc containers', function(done) {
    var selectedMachineStub = utils.makeStubMethod(view,
        '_getSelectedMachine', '0');
    this._cleanups.push(selectedMachineStub.reset);
    var selectedContainerStub = utils.makeStubMethod(view,
        '_getSelectedContainer', 'lxc');
    this._cleanups.push(selectedContainerStub.reset);
    view.on('moveToken', function(e) {
      assert.equal(e.unit, view.get('unit'));
      assert.equal(e.machine, '0');
      assert.equal(e.container, 'lxc');
      assert.deepEqual(e.constraints, {});
      done();
    });
    // Move the unit.
    container.one('.actions .move').simulate('click');
  });
});

/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('MachineViewMachine', function() {
  var acl, services;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view-machine', function() { done(); });
  });

  beforeEach(function () {
    acl = {isReadOnly: sinon.stub().returns(false)};
    services = {
      getById: sinon.stub().returns({
        get: function(val) {
          switch (val) {
            case 'icon':
              return 'icon.svg';
              break;
            case 'fade':
              return false;
              break;
            case 'hide':
              return false;
              break;
          }
        }
      })
    };
  });

  it('can render a machine', function() {
    var removeUnit = sinon.stub();
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096,
      },
      series: 'wily'
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        agent_state: 'started',
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        agent_state: 'started',
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={sinon.stub()}
        dropUnit={sinon.stub()}
        isOver={false}
        machine={machine}
        removeUnit={removeUnit}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        showConstraints={true}
        type="machine"
        units={units}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__machine machine-view__machine--machine"
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        <juju.components.MoreMenu
          items={[{
            label: 'Destroy',
            action: instance._destroyMachine
          }]} />
        <div className="machine-view__machine-name">
          new0
        </div>
        <div className="machine-view__machine-hardware">
          {2} unit{'s'}, {'wily, '} {'2x2GHz, 4.00GB, 2.00GB'}
        </div>
        <ul className="machine-view__machine-units">
          <juju.components.MachineViewMachineUnit
            acl={acl}
            key="wordpress/0"
            machineType="machine"
            removeUnit={removeUnit}
            service={services.getById()}
            unit={{
              'agent_state': 'started',
              'displayName': 'wordpress/0',
              'id': 'wordpress/0'}} />
          <juju.components.MachineViewMachineUnit
            acl={acl}
            key="wordpress/1"
            machineType="machine"
            removeUnit={removeUnit}
            service={services.getById()}
            unit={{
              'agent_state': 'started',
              'displayName': 'wordpress/1',
              'id': 'wordpress/1'}} />
        </ul>
        <div className="machine-view__machine-drop-target">
          <div className="machine-view__machine-drop-message">
            Add to {'new0'}
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render a machine in drop mode', function() {
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096,
      }
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        agent_state: 'started',
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        agent_state: 'started',
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={true}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={sinon.stub()}
        dropUnit={sinon.stub()}
        isOver={true}
        machine={machine}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        showConstraints={true}
        type="machine"
        units={units}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className={'machine-view__machine machine-view__machine--drop ' +
        'machine-view__machine--machine'}
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        {output.props.children}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display a machine as uncommitted', function() {
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      hardware: {},
      commitStatus: 'uncommitted'
    };
    var units = {filterByMachine: sinon.stub().returns([])};
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={sinon.stub()}
        dropUnit={sinon.stub()}
        isOver={false}
        machine={machine}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        type="machine"
        units={units}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className={'machine-view__machine ' +
        'machine-view__machine--uncommitted machine-view__machine--machine'}
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        {output.props.children}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display a deleted machine as uncommitted', function() {
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      hardware: {},
      deleted: true
    };
    var units = {filterByMachine: sinon.stub().returns([])};
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={sinon.stub()}
        dropUnit={sinon.stub()}
        isOver={false}
        machine={machine}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        type="machine"
        units={units}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className={'machine-view__machine ' +
        'machine-view__machine--uncommitted machine-view__machine--machine'}
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        {output.props.children}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can hide units', function() {
    var removeUnit = sinon.stub();
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096,
      }
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        deleted: false,
        displayName: 'mysql/0',
        id: 'mysql/0',
        service: 'mysql'
      }, {
        deleted: false,
        displayName: 'wordpress/1',
        id: 'wordpress/1',
        service: 'wordpress'
      }])
    };
    var wordpress = {
      get: function(val) {
        switch (val) {
          case 'icon':
            return 'icon.svg';
            break;
          case 'fade':
            return false;
            break;
          case 'hide':
            return false;
            break;
        }
      }
    };
    services.getById = function(val) {
      switch (val) {
        case 'mysql':
          return {
            get: function(val) {
              switch (val) {
                case 'icon':
                  return 'icon.svg';
                  break;
                case 'fade':
                  return true;
                  break;
                case 'hide':
                  return true;
                  break;
              }
            }
          };
          break;
        case 'wordpress':
          return wordpress;
          break;
      }
    };
    var output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={sinon.stub()}
        dropUnit={sinon.stub()}
        isOver={false}
        machine={machine}
        removeUnit={removeUnit}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        type="machine"
        units={units}/>);
    var expected = (
      <ul className="machine-view__machine-units">
        {[
          <juju.components.MachineViewMachineUnit
            acl={acl}
            key="wordpress/1"
            machineType="machine"
            removeUnit={removeUnit}
            service={wordpress}
            unit={{
              'deleted': false,
              'displayName': 'wordpress/1',
              'id': 'wordpress/1',
              'service': 'wordpress'}} />
        ]}
      </ul>);
    assert.deepEqual(output.props.children[3], expected);
  });

  it('can hide the constraints', function() {
    var removeUnit = sinon.stub();
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096,
      }
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        agent_state: 'started',
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        agent_state: 'started',
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={sinon.stub()}
        dropUnit={sinon.stub()}
        isOver={false}
        machine={machine}
        removeUnit={removeUnit}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        showConstraints={false}
        type="machine"
        units={units}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__machine machine-view__machine--machine"
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        <juju.components.MoreMenu
          items={[{
            label: 'Destroy',
            action: instance._destroyMachine
          }]} />
        <div className="machine-view__machine-name">
          new0
        </div>
        {undefined}
        <ul className="machine-view__machine-units">
          <juju.components.MachineViewMachineUnit
            acl={acl}
            key="wordpress/0"
            machineType="machine"
            removeUnit={removeUnit}
            service={services.getById()}
            unit={{
              'agent_state': 'started',
              'displayName': 'wordpress/0',
              'id': 'wordpress/0'}} />
          <juju.components.MachineViewMachineUnit
            acl={acl}
            key="wordpress/1"
            machineType="machine"
            removeUnit={removeUnit}
            service={services.getById()}
            unit={{
              'agent_state': 'started',
              'displayName': 'wordpress/1',
              'id': 'wordpress/1'}} />
        </ul>
        <div className="machine-view__machine-drop-target">
          <div className="machine-view__machine-drop-message">
            Add to {'new0'}
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render a machine with no hardware', function() {
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      hardware: {}
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={sinon.stub()}
        dropUnit={sinon.stub()}
        isOver={false}
        machine={machine}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        showConstraints={true}
        type="machine"
        units={units}/>);
    var expected = (
      <div className="machine-view__machine-hardware">
        {2} unit{'s'}, {undefined} {'hardware details not available'}
      </div>);
    assert.deepEqual(output.props.children[2], expected);
  });

  it('can render a container', function() {
    var machine = {
      displayName: 'new0/lxc/0',
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        agent_state: 'started',
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        agent_state: 'started',
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var removeUnit = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={sinon.stub()}
        dropUnit={sinon.stub()}
        isOver={false}
        machine={machine}
        removeUnit={removeUnit}
        services={services}
        showConstraints={true}
        type="container"
        units={units}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__machine machine-view__machine--container"
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        <juju.components.MoreMenu
          items={[{
            label: 'Destroy',
            action: instance._destroyMachine
          }]} />
        <div className="machine-view__machine-name">
          new0/lxc/0
        </div>
        {undefined}
        <ul className="machine-view__machine-units">
          <juju.components.MachineViewMachineUnit
            acl={acl}
            key="wordpress/0"
            machineType="container"
            removeUnit={removeUnit}
            service={services.getById()}
            unit={{
              'agent_state': 'started',
              'displayName': 'wordpress/0',
              'id': 'wordpress/0'}} />
          <juju.components.MachineViewMachineUnit
            acl={acl}
            key="wordpress/1"
            machineType="container"
            removeUnit={removeUnit}
            service={services.getById()}
            unit={{
              'agent_state': 'started',
              'displayName': 'wordpress/1',
              'id': 'wordpress/1'}} />
        </ul>
        <div className="machine-view__machine-drop-target">
          <div className="machine-view__machine-drop-message">
            Add to {'new0/lxc/0'}
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can destroy a machine', function() {
    var destroyMachines = sinon.stub();
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      id: 'new0'
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={destroyMachines}
        dropUnit={sinon.stub()}
        isOver={false}
        machine={machine}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        showConstraints={true}
        type="machine"
        units={units}/>);
    output.props.children[0].props.items[0].action();
    assert.equal(destroyMachines.callCount, 1);
    assert.deepEqual(destroyMachines.args[0][0], ['new0']);
  });

  it('can remove a unit', function() {
    var machine = {
      displayName: 'new0/lxc/0',
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var removeUnit = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={sinon.stub()}
        dropUnit={sinon.stub()}
        isOver={false}
        machine={machine}
        services={services}
        type="container"
        removeUnit={removeUnit}
        showConstraints={true}
        units={units}/>, true);
    var output = renderer.getRenderOutput();
    output.props.children[3].props.children[0].props.removeUnit();
    assert.equal(removeUnit.callCount, 1);
  });

  it('can disable the destroy when ready only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var removeUnit = sinon.stub();
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096,
      },
      series: 'wily'
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        agent_state: 'started',
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        agent_state: 'started',
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        destroyMachines={sinon.stub()}
        dropUnit={sinon.stub()}
        isOver={false}
        machine={machine}
        removeUnit={removeUnit}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        showConstraints={true}
        type="machine"
        units={units}/>, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.MoreMenu
        items={[{
          label: 'Destroy',
          action: false
        }]} />);
    assert.deepEqual(output.props.children[0], expected);
  });
});

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

describe('MachineView', function() {
  var machines;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view', function() { done(); });
  });

  beforeEach(function() {
    machines = {
      filterByParent: sinon.stub().returns([{
        displayName: 'new0',
        id: 'new0'
      }, {
        displayName: 'new1',
        id: 'new1'
      }, {
        displayName: 'new2',
        id: 'new2'
      }]),
      getById: sinon.stub()
    };
  });

  it('can render', function() {
    var machines = {
      filterByParent: sinon.stub().returns([])
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var placeUnit = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        machines={machines}
        placeUnit={placeUnit}
        removeUnits={sinon.stub()}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var machineMenuItems = output.props.children.props.children[1]
      .props.children[0].props.menuItems;
    var containerMenuItems = output.props.children.props.children[2]
      .props.children[0].props.menuItems;
    var expected = (
      <div className="machine-view">
        <div className="machine-view__content">
          <div className="machine-view__column">
            <juju.components.MachineViewHeader
              droppable={false}
              title="New units"
              toggle={{
                action: instance._toggleScaleUp,
                disabled: true,
                toggleOn: false
              }} />
            <div className="machine-view__column-content">
              {undefined}
              <div className="machine-view__column-onboarding">
                <juju.components.SvgIcon name="add_16"
                  size="16" />
                Add services to get started
              </div>
            </div>
          </div>
          <div className="machine-view__column machine-view__column--overlap">
            <juju.components.MachineViewHeader
              activeMenuItem="name"
              droppable={true}
              dropUnit={instance._dropUnit}
              menuItems={[{
                label: 'Add machine',
                action: instance._addMachine
              }, {
                label: 'Hide constraints',
                action: instance._toggleConstraints
              }, {
                label: 'Sort by:'
              }, {
                label: 'Name',
                id: 'name',
                action: machineMenuItems[3].action
              }, {
                label: 'No. services',
                id: 'services',
                action: machineMenuItems[4].action
              }, {
                label: 'No. units',
                id: 'units',
                action: machineMenuItems[5].action
              }, {
                label: 'Disk',
                id: 'disk',
                action: machineMenuItems[6].action
              }, {
                label: 'RAM',
                id: 'ram',
                action: machineMenuItems[7].action
              }, {
                label: 'CPU',
                id: 'cpu',
                action: machineMenuItems[8].action
              }]}
              title="My Env (0)"
              type="machine" />
            <div className="machine-view__column-content">
              {undefined}
              <div className="machine-view__column-onboarding">
                Use machine view to:
                <ul>
                  <li>Create machines</li>
                  <li>Create containers</li>
                  <li>Customise placement</li>
                  <li>Scale up your environment</li>
                  <li>Manually place new units</li>
                  <li>Collocate services</li>
                </ul>
                <span className="link"
                  onClick={instance._addMachine}
                  role="button"
                  tabIndex="0">
                  Add machine
                </span>
              </div>
            </div>
          </div>
          <div className="machine-view__column">
            <juju.components.MachineViewHeader
              activeMenuItem="name"
              droppable={false}
              dropUnit={instance._dropUnit}
              menuItems={[{
                label: 'Add container',
                action: instance._addContainer
              }, {
                label: 'Sort by:'
              }, {
                label: 'Name',
                id: 'name',
                action: containerMenuItems[2].action
              }, {
                label: 'No. units',
                id: 'units',
                action: containerMenuItems[3].action
              }, {
                label: 'Services',
                id: 'services',
                action: containerMenuItems[4].action
              }]}
              title="0 containers, 0 units"
              type="container" />
            <div className="machine-view__column-content">
              {undefined}
              {undefined}
            </div>
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display onboarding if there are no services', function() {
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        units={units}
        services={services} />);
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <div className="machine-view__column-onboarding">
          <juju.components.SvgIcon name="add_16"
            size="16" />
          Add services to get started
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[0].props.children[1], expected);
  });

  it('can display onboarding if there are no unplaced units', function() {
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(1)
    };
    var output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        units={units}
        services={services} />);
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <div className="machine-view__column-onboarding">
          <juju.components.SvgIcon name="task-done_16"
            size="16" />
          You have placed all of your units
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[0].props.children[1], expected);
  });

  it('can display a service scale up form', function() {
    var addGhostAndEcsUnits = sinon.stub();
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(1)
    };
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={addGhostAndEcsUnits}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        units={units}
        services={services} />, true);
    var instance = renderer.getMountedInstance();
    instance._toggleScaleUp();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        <juju.components.MachineViewScaleUp
          addGhostAndEcsUnits={addGhostAndEcsUnits}
          services={services}
          toggleScaleUp={instance._toggleScaleUp} />
        <div className="machine-view__column-onboarding">
          <juju.components.SvgIcon name="task-done_16"
            size="16" />
          You have placed all of your units
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[0].props.children[1], expected);
  });

  it('can display a list of unplaced units', function() {
    var autoPlaceUnits = sinon.stub();
    var createMachine = sinon.stub();
    var placeUnit = sinon.stub();
    var removeUnits = sinon.stub();
    var unitList = [{
      id: 'django/0',
      service: 'django'
    }, {
      id: 'django/1',
      service: 'django'
    }];
    var units = {
      filterByMachine: sinon.stub().returns(unitList)
    };
    var services = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: sinon.stub().returns('django.svg')
      })
    };
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={autoPlaceUnits}
        createMachine={createMachine}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        machines={machines}
        placeUnit={placeUnit}
        removeUnits={removeUnits}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <div>
          <div className="machine-view__auto-place">
            <button onClick={autoPlaceUnits}>
              Auto place
            </button>
            or manually place
          </div>
          <ul className="machine-view__list">
            <juju.components.MachineViewUnplacedUnit
              createMachine={createMachine}
              icon="django.svg"
              key="django/0"
              machines={machines}
              removeUnit={instance._removeUnit}
              placeUnit={placeUnit}
              selectMachine={instance.selectMachine}
              unit={unitList[0]} />
            <juju.components.MachineViewUnplacedUnit
              createMachine={createMachine}
              icon="django.svg"
              key="django/1"
              machines={machines}
              placeUnit={placeUnit}
              removeUnit={instance._removeUnit}
              selectMachine={instance.selectMachine}
              unit={unitList[1]} />
          </ul>
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[0].props.children[1], expected);
  });

  it('can auto place units', function() {
    var autoPlaceUnits = sinon.stub();
    var unitList = [{
      id: 'django/0',
      service: 'django'
    }, {
      id: 'django/1',
      service: 'django'
    }];
    var units = {
      filterByMachine: sinon.stub().returns(unitList)
    };
    var services = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: sinon.stub().returns('django.svg')
      })
    };
    var output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={autoPlaceUnits}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units} />);
    output.props.children.props.children[0].props.children[1]
      .props.children[1].props.children[0].props.children[0].props.onClick();
    assert.equal(autoPlaceUnits.callCount, 1);
  });

  it('can display onboarding if there are no machines', function() {
    var machines = {
      filterByParent: sinon.stub().returns([])
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <div className="machine-view__column-onboarding">
          Use machine view to:
          <ul>
            <li>Create machines</li>
            <li>Create containers</li>
            <li>Customise placement</li>
            <li>Scale up your environment</li>
            <li>Manually place new units</li>
            <li>Collocate services</li>
          </ul>
          <span className="link"
            onClick={instance._addMachine}
            role="button"
            tabIndex="0">
            Add machine
          </span>
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[1].props.children[1], expected);
  });

  it('can display onboarding if there is one machine', function() {
    var machineList = [{
      displayName: 'new0',
      id: 'new0'
    }];
    var filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([]);
    var machines = {
      filterByParent: filterByParent,
      getById: sinon.stub()
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var destroyMachines = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <div>
          <div className="machine-view__column-onboarding">
            Drag and drop unplaced units onto your machines and containers to
            customise your deployment.
          </div>
          <ul className="machine-view__list">
            {[<juju.components.MachineViewMachine
              destroyMachines={destroyMachines}
              dropUnit={instance._dropUnit}
              key="new0"
              machine={machineList[0]}
              selected={true}
              selectMachine={instance.selectMachine}
              services={services}
              showConstraints={true}
              type="machine"
              units={units} />]}
          </ul>
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[1].props.children[1], expected);
  });

  it('can display a list of machines', function() {
    var machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    var filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([]);
    var machines = {
      filterByParent: filterByParent,
      getById: sinon.stub()
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var destroyMachines = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <div>
          {undefined}
          <ul className="machine-view__list">
            <juju.components.MachineViewMachine
              destroyMachines={destroyMachines}
              dropUnit={instance._dropUnit}
              key="new0"
              machine={machineList[0]}
              selected={true}
              selectMachine={instance.selectMachine}
              services={services}
              showConstraints={true}
              type="machine"
              units={units} />
            <juju.components.MachineViewMachine
              destroyMachines={destroyMachines}
              dropUnit={instance._dropUnit}
              key="new1"
              machine={machineList[1]}
              selected={false}
              selectMachine={instance.selectMachine}
              services={services}
              showConstraints={true}
              type="machine"
              units={units} />
          </ul>
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[1].props.children[1], expected);
  });

  it('can order a list of machines', function() {
    var machineList = [{
      displayName: 'new5',
      id: 'new5'
    }, {
      displayName: 'new0',
      id: 'new0'
    }];
    var filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([]);
    var machines = {
      filterByParent: filterByParent,
      getById: sinon.stub()
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var destroyMachines = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <div>
          {undefined}
          <ul className="machine-view__list">
            <juju.components.MachineViewMachine
              destroyMachines={destroyMachines}
              dropUnit={instance._dropUnit}
              key="new0"
              machine={{
                displayName: 'new0',
                id: 'new0'
              }}
              selected={false}
              selectMachine={instance.selectMachine}
              services={services}
              showConstraints={true}
              type="machine"
              units={units} />
            <juju.components.MachineViewMachine
              destroyMachines={destroyMachines}
              dropUnit={instance._dropUnit}
              key="new5"
              machine={{
                displayName: 'new5',
                id: 'new5'
              }}
              selected={true}
              selectMachine={instance.selectMachine}
              services={services}
              showConstraints={true}
              type="machine"
              units={units} />
          </ul>
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[1].props.children[1], expected);
  });

  it('can toggle constraints on machines', function() {
    var machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    var filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([]);
    var machines = {
      filterByParent: filterByParent,
      getById: sinon.stub()
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var destroyMachines = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    instance._toggleConstraints();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <div>
          {undefined}
          <ul className="machine-view__list">
            <juju.components.MachineViewMachine
              destroyMachines={destroyMachines}
              dropUnit={instance._dropUnit}
              key="new0"
              machine={machineList[0]}
              selected={true}
              selectMachine={instance.selectMachine}
              services={services}
              showConstraints={true}
              type="machine"
              units={units} />
            <juju.components.MachineViewMachine
              destroyMachines={destroyMachines}
              dropUnit={instance._dropUnit}
              key="new1"
              machine={machineList[1]}
              selected={false}
              selectMachine={instance.selectMachine}
              services={services}
              showConstraints={false}
              type="machine"
              units={units} />
          </ul>
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[1].props.children[1], expected);
  });

  it('can display a form for adding a machine', function() {
    var machines = {
      filterByParent: sinon.stub().returns([])
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var createMachine = sinon.stub();
    var placeUnit = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        machines={machines}
        placeUnit={placeUnit}
        removeUnits={sinon.stub()}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    instance._addMachine();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        <juju.components.MachineViewAddMachine
          close={instance._closeAddMachine}
          createMachine={createMachine}
          placeUnit={placeUnit}
          selectMachine={instance.selectMachine}
          unit={null} />
        {undefined}
      </div>);
    assert.deepEqual(
      output.props.children.props.children[1].props.children[1], expected);
  });

  it('can select a machine', function() {
    var machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    var machines = {
      filterByParent: sinon.stub().returns(machineList),
      getById: sinon.stub()
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    assert.equal(instance.state.selectedMachine, 'new0');
    instance.selectMachine('new1');
    assert.equal(instance.state.selectedMachine, 'new1');
  });

  it('can display a list of containers', function() {
    var machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    var filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([{
      id: 'new0/lxc/0'
    }]);
    var machines = {
      filterByParent: filterByParent,
      getById: sinon.stub().returns({
        id: 'new0',
        commitStatus: 'committed'
      })
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var destroyMachines = sinon.stub();
    var removeUnits = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={removeUnits}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <ul className="machine-view__list">
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            dropUnit={instance._dropUnit}
            key="new0"
            machine={{
              commitStatus: 'committed',
              deleted: undefined,
              displayName: 'Root container',
              id: 'new0',
              root: true
            }}
            removeUnit={instance._removeUnit}
            services={services}
            type="container"
            units={units} />
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            dropUnit={instance._dropUnit}
            key="new0/lxc/0"
            machine={{id: 'new0/lxc/0'}}
            removeUnit={instance._removeUnit}
            services={services}
            type="container"
            units={units} />
        </ul>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[2].props.children[1], expected);
  });

  it('can order a list of containers', function() {
    var machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    var filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([{
      displayName: 'new0/lxc/5',
      id: 'new0/lxc/5'
    }, {
      displayName: 'new0/lxc/0',
      id: 'new0/lxc/0'
    }]);
    var machines = {
      filterByParent: filterByParent,
      getById: sinon.stub().returns({
        id: 'new0',
        commitStatus: 'committed'
      })
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var destroyMachines = sinon.stub();
    var removeUnits = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={removeUnits}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <ul className="machine-view__list">
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            dropUnit={instance._dropUnit}
            key="new0"
            machine={{
              commitStatus: 'committed',
              deleted: undefined,
              displayName: 'Root container',
              id: 'new0',
              root: true
            }}
            removeUnit={instance._removeUnit}
            services={services}
            type="container"
            units={units} />
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            dropUnit={instance._dropUnit}
            key="new0/lxc/0"
            machine={{
              displayName: 'new0/lxc/0',
              id: 'new0/lxc/0'
            }}
            removeUnit={instance._removeUnit}
            services={services}
            type="container"
            units={units} />
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            dropUnit={instance._dropUnit}
            key="new0/lxc/5"
            machine={{
              displayName: 'new0/lxc/5',
              id: 'new0/lxc/5'
            }}
            removeUnit={instance._removeUnit}
            services={services}
            type="container"
            units={units} />
        </ul>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[2].props.children[1], expected);
  });

  it('can display a form for adding a container', function() {
    var machines = {
      filterByParent: function(arg) {
        if (arg == 'new0') {
          return [{id: 'new0/lxc/0'}];
        }
        return [{id: 'new0'}];
      },
      getById: sinon.stub().returns({
        id: 'new0',
        commitStatus: 'committed'
      })
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var createMachine = sinon.stub();
    var destroyMachines = sinon.stub();
    var placeUnit = sinon.stub();
    var removeUnits = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        machines={machines}
        placeUnit={placeUnit}
        removeUnits={removeUnits}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    instance._addContainer();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        <juju.components.MachineViewAddMachine
          close={instance._closeAddContainer}
          createMachine={createMachine}
          parentId="new0"
          placeUnit={placeUnit}
          unit={null} />
        <ul className="machine-view__list">
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            dropUnit={instance._dropUnit}
            key="new0"
            machine={{
              commitStatus: 'committed',
              deleted: undefined,
              displayName: 'Root container',
              id: 'new0',
              root: true
            }}
            removeUnit={instance._removeUnit}
            services={services}
            type="container"
            units={units} />
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            dropUnit={instance._dropUnit}
            key="new0/lxc/0"
            machine={{id: 'new0/lxc/0'}}
            removeUnit={instance._removeUnit}
            services={services}
            type="container"
            units={units} />
        </ul>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[2].props.children[1], expected);
  });

  it('does not show an add container form for deleted machines', function() {
    var machines = {
      filterByParent: function(arg) {
        if (arg == 'new0') {
          return [{id: 'new0/lxc/0'}];
        }
        return [{id: 'new0'}];
      },
      getById: sinon.stub().returns({
        id: 'new0',
        deleted: true,
        commitStatus: 'committed'
      })
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var createMachine = sinon.stub();
    var destroyMachines = sinon.stub();
    var removeUnits = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        units={units}
        removeUnits={removeUnits}
        services={services}
        machines={machines} />, true);
    var instance = renderer.getMountedInstance();
    instance._addContainer();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <ul className="machine-view__list">
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            dropUnit={instance._dropUnit}
            key="new0"
            machine={{
              commitStatus: 'committed',
              deleted: true,
              displayName: 'Root container',
              id: 'new0',
              root: true
            }}
            removeUnit={instance._removeUnit}
            services={services}
            type="container"
            units={units} />
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            dropUnit={instance._dropUnit}
            key="new0/lxc/0"
            machine={{id: 'new0/lxc/0'}}
            removeUnit={instance._removeUnit}
            services={services}
            type="container"
            units={units} />
        </ul>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[2].props.children[1], expected);
  });

  it('can remove a unit', function() {
    var machines = {
      filterByParent: function(arg) {
        if (arg == 'new0') {
          return [{id: 'new0/lxc/0'}];
        }
        return [{id: 'new0'}];
      },
      getById: sinon.stub()
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var createMachine = sinon.stub();
    var destroyMachines = sinon.stub();
    var removeUnits = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        machines={machines}
        placeUnit={sinon.stub()}
        removeUnits={removeUnits}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    instance._removeUnit('wordpress/8');
    assert.equal(removeUnits.callCount, 1);
    assert.deepEqual(removeUnits.args[0][0], ['wordpress/8']);
  });

  it('can place a unit on a machine', function() {
    var machines = {
      filterByParent: function(arg) {
        if (arg == 'new0') {
          return [{id: 'new0/lxc/0'}];
        }
        return [{id: 'new0'}];
      },
      getById: sinon.stub()
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var createMachine = sinon.stub();
    var destroyMachines = sinon.stub();
    var placeUnit = sinon.stub();
    var removeUnits = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        machines={machines}
        placeUnit={placeUnit}
        removeUnits={removeUnits}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    instance._dropUnit('wordpress/8', 'new0');
    assert.equal(placeUnit.callCount, 1);
    assert.deepEqual(placeUnit.args[0][0], 'wordpress/8');
    assert.deepEqual(placeUnit.args[0][1], 'new0');
  });
});

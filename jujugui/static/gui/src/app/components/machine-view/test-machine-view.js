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

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view', function() { done(); });
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
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineView
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view">
        <div className="machine-view__content">
          <div className="machine-view__column">
            <juju.components.MachineViewHeader
              title="New units" />
            <div className="machine-view__column-content">
              <div className="machine-view__column-onboarding">
                <juju.components.SvgIcon name="add_16"
                  size="16" />
                Add services to get started
              </div>
            </div>
          </div>
          <div className="machine-view__column machine-view__column--overlap">
            <juju.components.MachineViewHeader
              menuItems={[{
                label: 'Add machine',
                action: instance._addMachine
              }]}
              title="My Env (0)" />
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
              menuItems={[{
                label: 'Add container',
                action: instance._addContainer
              }]}
              title="0 containers, 0 units" />
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
    var machines = {
      filterByParent: sinon.stub().returns([1, 2, 3])
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineView
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />);
    var expected = (
      <div className="machine-view__column-content">
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
    var machines = {
      filterByParent: sinon.stub().returns([1, 2, 3])
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(1)
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineView
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />);
    var expected = (
      <div className="machine-view__column-content">
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
    var machines = {
      filterByParent: sinon.stub().returns([1, 2, 3])
    };
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
      <juju.components.MachineView
        autoPlaceUnits={autoPlaceUnits}
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />);
    var expected = (
      <div className="machine-view__column-content">
        <div>
          <div className="machine-view__auto-place">
            <button onClick={autoPlaceUnits}>
              Auto place
            </button>
            or manually place
          </div>
          <ul className="machine-view__list">
            <juju.components.MachineViewUnplacedUnit
              key="django/0"
              icon="django.svg"
              unit={unitList[0]} />
            <juju.components.MachineViewUnplacedUnit
              key="django/1"
              icon="django.svg"
              unit={unitList[1]} />
          </ul>
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[0].props.children[1], expected);
  });

  it('can auto place units', function() {
    var autoPlaceUnits = sinon.stub();
    var machines = {
      filterByParent: sinon.stub().returns([1, 2, 3])
    };
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
      <juju.components.MachineView
        autoPlaceUnits={autoPlaceUnits}
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />);
    output.props.children.props.children[0].props.children[1]
      .props.children.props.children[0].props.children[0].props.onClick();
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
      <juju.components.MachineView
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />, true);
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
      id: 'new0'
    }];
    var filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([]);
    var machines = {filterByParent: filterByParent};
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var destroyMachines = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineView
        destroyMachines={destroyMachines}
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />, true);
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
              key="new0"
              machine={machineList[0]}
              selected={true}
              selectMachine={instance.selectMachine}
              services={services}
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
      id: 'new0'
    }, {
      id: 'new1'
    }];
    var filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([]);
    var machines = {filterByParent: filterByParent};
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var destroyMachines = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineView
        destroyMachines={destroyMachines}
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />, true);
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
              key="new0"
              machine={machineList[0]}
              selected={true}
              selectMachine={instance.selectMachine}
              services={services}
              type="machine"
              units={units} />
            <juju.components.MachineViewMachine
              destroyMachines={destroyMachines}
              key="new1"
              machine={machineList[1]}
              selected={false}
              selectMachine={instance.selectMachine}
              services={services}
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
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineView
        createMachine={createMachine}
        environmentName="My Env"
        machines={machines}
        services={services}
        units={units} />, true);
    var instance = renderer.getMountedInstance();
    instance._addMachine();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__column-content">
        <juju.components.MachineViewAddMachine
          close={instance._closeAddMachine}
          createMachine={createMachine} />
        {undefined}
      </div>);
    assert.deepEqual(
      output.props.children.props.children[1].props.children[1], expected);
  });

  it('can select a machine', function() {
    var machineList = [{
      id: 'new0'
    }, {
      id: 'new1'
    }];
    var machines = {
      filterByParent: sinon.stub().returns(machineList)
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineView
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />, true);
    var instance = renderer.getMountedInstance();
    assert.equal(instance.state.selectedMachine, 'new0');
    instance.selectMachine('new1');
    assert.equal(instance.state.selectedMachine, 'new1');
  });

  it('can display a list of containers', function() {
    var machineList = [{
      id: 'new0'
    }, {
      id: 'new1'
    }];
    var filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([{
      id: 'new0/lxc/0'
    }]);
    var machines = {filterByParent: filterByParent};
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var destroyMachines = sinon.stub();
    var removeUnits = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineView
        destroyMachines={destroyMachines}
        environmentName="My Env"
        units={units}
        removeUnits={removeUnits}
        services={services}
        machines={machines} />);
    var expected = (
      <div className="machine-view__column-content">
        {undefined}
        <ul className="machine-view__list">
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            key="new0"
            machine={{id: 'new0', displayName: 'Root container', root: true}}
            removeUnits={removeUnits}
            services={services}
            type="container"
            units={units} />
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            key="new0/lxc/0"
            machine={{id: 'new0/lxc/0'}}
            removeUnits={removeUnits}
            services={services}
            type="container"
            units={units} />
        </ul>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[2].props.children[1], expected);
  });

  it('can display a form for adding a container', function() {
    var machines = {filterByParent: function(arg) {
      if (arg == 'new0') {
        return [{id: 'new0/lxc/0'}];
      }
      return [{id: 'new0'}];
    }};
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
      <juju.components.MachineView
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
        <juju.components.MachineViewAddMachine
          close={instance._closeAddContainer}
          createMachine={createMachine}
          parentId="new0" />
        <ul className="machine-view__list">
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            key="new0"
            machine={{displayName: 'Root container', id: 'new0', root: true}}
            removeUnits={removeUnits}
            services={services}
            type="container"
            units={units} />
          <juju.components.MachineViewMachine
            destroyMachines={destroyMachines}
            key="new0/lxc/0"
            machine={{id: 'new0/lxc/0'}}
            removeUnits={removeUnits}
            services={services}
            type="container"
            units={units} />
        </ul>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[2].props.children[1], expected);
  });
});

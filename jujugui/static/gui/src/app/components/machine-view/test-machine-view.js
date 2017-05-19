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
  let acl, machines, parseConstraints, generateMachineDetails;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view', function() { done(); });
  });

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    parseConstraints = sinon.stub();
    generateMachineDetails = sinon.stub();
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
      getById: sinon.stub(),
      revive: sinon.stub()
    };
  });

  it('can render', function() {
    const machines = {
      filterByParent: sinon.stub().returns([]),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const placeUnit = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={placeUnit}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const machineMenuItems = output.props.children.props.children[1]
      .props.menuItems;
    const containerMenuItems = output.props.children.props.children[2]
      .props.menuItems;
    const expected = (
      <div className="machine-view">
        <div className="machine-view__content">
          <juju.components.MachineViewColumn
            acl={acl}
            droppable={false}
            title="New units"
            toggle={{
              action: instance._toggleScaleUp,
              disabled: true,
              toggleOn: false
            }}>
            {undefined}
            <div className="machine-view__column-onboarding">
              <juju.components.SvgIcon name="add_16"
                size="16" />
              <span className="link"
                onClick={instance._openStore}>
                Add applications to get started
              </span>
            </div>
          </juju.components.MachineViewColumn>
          <juju.components.MachineViewColumn
            acl={acl}
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
              label: 'No. applications',
              id: 'applications',
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
            type="machine">
            {undefined}
            <div className="machine-view__column-onboarding">
              <p>Use machine view to:</p>
              <ul>
                <li>Create machines</li>
                <li>Create containers</li>
                <li>Customise placement</li>
                <li>Scale up your model</li>
                <li>Manually place new units</li>
                <li>Collocate applications</li>
              </ul>
              <span className="link"
                onClick={instance._addMachine}
                role="button"
                tabIndex="0">
                Add machine
              </span>
            </div>
          </juju.components.MachineViewColumn>
          <juju.components.MachineViewColumn
            acl={acl}
            activeMenuItem="name"
            droppable={false}
            dropUnit={instance._dropUnit}
            menuItems={[{
              label: 'Add container',
              action: null
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
              label: 'Applications',
              id: 'applications',
              action: containerMenuItems[4].action
            }]}
            title="0 containers, 0 units"
            type="container">
            {undefined}
            {undefined}
          </juju.components.MachineViewColumn>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display onboarding if there are no applications', function() {
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="machine-view__column-onboarding">
        <juju.components.SvgIcon name="add_16"
          size="16" />
        <span className="link"
          onClick={instance._openStore}>
          Add applications to get started
        </span>
      </div>);
    expect(
      output.props.children.props.children[0].props.children[1]).toEqualJSX(
      expected);
  });

  it('can open the store from the onboarding', function() {
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={changeState}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    output.props.children.props.children[0].props.children[1].props.children[1]
      .props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {store: ''});
  });

  it('can display onboarding if there are no unplaced units', function() {
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(1)
    };
    const output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />);
    const expected = (
      <div className="machine-view__column-onboarding">
        <juju.components.SvgIcon name="task-done_16"
          size="16" />
        You have placed all of your units
      </div>);
    expect(
      output.props.children.props.children[0].props.children[1]).toEqualJSX(
        expected);
  });

  it('can display a service scale up form', function() {
    const addGhostAndEcsUnits = sinon.stub();
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(1)
    };
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={addGhostAndEcsUnits}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance._toggleScaleUp();
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.MachineViewScaleUp
        acl={acl}
        addGhostAndEcsUnits={addGhostAndEcsUnits}
        services={services}
        toggleScaleUp={instance._toggleScaleUp} />);
    expect(
      output.props.children.props.children[0].props.children[0]).toEqualJSX(
        expected);
  });

  it('can display a list of unplaced units', function() {
    const autoPlaceUnits = sinon.stub();
    const createMachine = sinon.stub();
    const placeUnit = sinon.stub();
    const removeUnits = sinon.stub();
    const unitList = [{
      id: 'django/0',
      service: 'django'
    }, {
      id: 'django/1',
      service: 'django'
    }];
    const units = {
      filterByMachine: sinon.stub().returns(unitList)
    };
    const getStub = sinon.stub();
    getStub.withArgs('icon').returns('django.svg');
    getStub.withArgs('subordinate').returns(false);
    const services = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: getStub
      })
    };
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={autoPlaceUnits}
        changeState={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={placeUnit}
        providerType={'azure'}
        removeUnits={removeUnits}
        series={['trusty', 'xenial']}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="machine-view__list">
        <juju.components.MachineViewUnplacedUnit
          acl={acl}
          createMachine={createMachine}
          icon="django.svg"
          key="django/0"
          machines={machines}
          removeUnit={instance._removeUnit}
          placeUnit={placeUnit}
          providerType={'azure'}
          selectMachine={instance.selectMachine}
          series={['trusty', 'xenial']}
          unit={unitList[0]} />
        <juju.components.MachineViewUnplacedUnit
          acl={acl}
          createMachine={createMachine}
          icon="django.svg"
          key="django/1"
          machines={machines}
          placeUnit={placeUnit}
          providerType={'azure'}
          removeUnit={instance._removeUnit}
          selectMachine={instance.selectMachine}
          series={['trusty', 'xenial']}
          unit={unitList[1]} />
      </ul>);
    expect(
      output.props.children.props.children[0].props.children[1]
      .props.children[1]).toEqualJSX(expected);
  });

  it('does not display unplaced subordinate units', function() {
    const autoPlaceUnits = sinon.stub();
    const createMachine = sinon.stub();
    const placeUnit = sinon.stub();
    const removeUnits = sinon.stub();
    const unitList = [{
      id: 'django/0',
      service: 'django'
    }, {
      id: 'django/1',
      service: 'django'
    }];
    const units = {
      filterByMachine: sinon.stub().returns(unitList)
    };
    const getStub = sinon.stub();
    getStub.withArgs('icon').returns('django.svg');
    getStub.withArgs('subordinate').onFirstCall().returns(false)
      .onSecondCall().returns(true);
    const services = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: getStub
      })
    };
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={autoPlaceUnits}
        changeState={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={placeUnit}
        providerType={'azure'}
        removeUnits={removeUnits}
        series={['trusty', 'xenial']}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="machine-view__list">
        {[<juju.components.MachineViewUnplacedUnit
          acl={acl}
          createMachine={createMachine}
          icon="django.svg"
          key="django/0"
          machines={machines}
          providerType={'azure'}
          removeUnit={instance._removeUnit}
          placeUnit={placeUnit}
          selectMachine={instance.selectMachine}
          series={['trusty', 'xenial']}
          unit={unitList[0]} />]}
      </ul>);
    expect(
      output.props.children.props.children[0].props.children[1]
      .props.children[1]).toEqualJSX(expected);
  });

  it('displays onboarding if there are only subordinate units', function() {
    const unitList = [{
      id: 'django/0',
      service: 'django'
    }, {
      id: 'django/1',
      service: 'django'
    }];
    const units = {
      filterByMachine: sinon.stub().returns(unitList)
    };
    const getStub = sinon.stub();
    getStub.withArgs('icon').returns('django.svg');
    getStub.withArgs('subordinate').returns(true);
    const services = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: getStub
      })
    };
    const output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />);
    const expected = (
      <div className="machine-view__column-onboarding">
        <juju.components.SvgIcon name="task-done_16"
          size="16" />
        You have placed all of your units
      </div>);
    expect(
      output.props.children.props.children[0].props.children[1]).toEqualJSX(
        expected);
  });

  it('can auto place units', function() {
    const autoPlaceUnits = sinon.stub();
    const unitList = [{
      id: 'django/0',
      service: 'django'
    }, {
      id: 'django/1',
      service: 'django'
    }];
    const units = {
      filterByMachine: sinon.stub().returns(unitList)
    };
    const getStub = sinon.stub();
    getStub.withArgs('icon').returns('django.svg');
    getStub.withArgs('subordinate').returns(false);
    const services = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: getStub
      })
    };
    const component = renderIntoDocument(
      <juju.components.MachineView
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={autoPlaceUnits}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />);
    const node = queryComponentSelector(component,
      '.machine-view__auto-place .button--inline-neutral');
    testUtils.Simulate.click(node);
    assert.equal(autoPlaceUnits.callCount, 1);
  });

  it('can disable auto place when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const autoPlaceUnits = sinon.stub();
    const unitList = [{
      id: 'django/0',
      service: 'django'
    }, {
      id: 'django/1',
      service: 'django'
    }];
    const units = {
      filterByMachine: sinon.stub().returns(unitList)
    };
    const getStub = sinon.stub();
    getStub.withArgs('icon').returns('django.svg');
    getStub.withArgs('subordinate').returns(false);
    const services = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: getStub
      })
    };
    const output = jsTestUtils.shallowRender(
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={autoPlaceUnits}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />);
    const expected = (
      <juju.components.GenericButton
        action={autoPlaceUnits}
        disabled={true}
        type="inline-neutral"
        title="Auto place" />);
    expect(
      output.props.children.props.children[0].props.children[1].props
        .children[0].props.children[0]).toEqualJSX(expected);
  });

  it('can display onboarding if there are no machines', function() {
    const machines = {
      filterByParent: sinon.stub().returns([]),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="machine-view__column-onboarding">
        <p>Use machine view to:</p>
        <ul>
          <li>Create machines</li>
          <li>Create containers</li>
          <li>Customise placement</li>
          <li>Scale up your model</li>
          <li>Manually place new units</li>
          <li>Collocate applications</li>
        </ul>
        <span className="link"
          onClick={instance._addMachine}
          role="button"
          tabIndex="0">
          Add machine
        </span>
      </div>);
    expect(
      output.props.children.props.children[1].props.children[1]).toEqualJSX(
        expected);
  });

  it('can display onboarding if there is one machine', function() {
    const machineList = [{
      displayName: 'new0',
      id: 'new0'
    }];
    const filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([]);
    const machines = {
      filterByParent: filterByParent,
      getById: sinon.stub(),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="machine-view__column-onboarding">
        Drag and drop unplaced units onto your machines and containers to
        customise your deployment.
      </div>);
    expect(
      output.props.children.props.children[1].props.children[1]
      .props.children[0]).toEqualJSX(expected);
  });

  it('can display a list of machines', function() {
    const machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    const filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([]);
    const machines = {
      filterByParent: filterByParent,
      getById: sinon.stub(),
      revive: sinon.stub().returns({get: sinon.stub()})
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const updateMachineConstraints = sinon.stub();
    const updateMachineSeries = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        providerType="aws"
        removeUnits={sinon.stub()}
        series={['wily']}
        services={services}
        units={units}
        updateMachineConstraints={updateMachineConstraints}
        updateMachineSeries={updateMachineSeries} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="machine-view__list">
        <juju.components.MachineViewMachine
          acl={acl}
          destroyMachines={destroyMachines}
          dropUnit={instance._dropUnit}
          generateMachineDetails={generateMachineDetails}
          key="new0"
          machine={machineList[0]}
          machineModel={{get: sinon.stub()}}
          parseConstraints={parseConstraints}
          providerType="aws"
          selected={true}
          selectMachine={instance.selectMachine}
          series={['wily']}
          services={services}
          showConstraints={true}
          type="machine"
          units={units}
          updateMachineConstraints={updateMachineConstraints}
          updateMachineSeries={updateMachineSeries} />
        <juju.components.MachineViewMachine
          acl={acl}
          destroyMachines={destroyMachines}
          dropUnit={instance._dropUnit}
          generateMachineDetails={generateMachineDetails}
          key="new1"
          machine={machineList[1]}
          machineModel={{get: sinon.stub()}}
          parseConstraints={parseConstraints}
          providerType="aws"
          selected={false}
          selectMachine={instance.selectMachine}
          series={['wily']}
          services={services}
          showConstraints={true}
          type="machine"
          units={units}
          updateMachineConstraints={updateMachineConstraints}
          updateMachineSeries={updateMachineSeries} />
      </ul>);
    expect(
      output.props.children.props.children[1].props.children[1]
      .props.children[1]).toEqualJSX(expected);
  });

  it('can order a list of machines', function() {
    const machineList = [{
      displayName: 'new5',
      id: 'new5'
    }, {
      displayName: 'new0',
      id: 'new0'
    }];
    const filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([]);
    const machines = {
      filterByParent: filterByParent,
      getById: sinon.stub(),
      revive: sinon.stub().returns({get: sinon.stub()})
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const updateMachineConstraints = sinon.stub();
    const updateMachineSeries = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        providerType="aws"
        removeUnits={sinon.stub()}
        series={['wily']}
        services={services}
        units={units}
        updateMachineConstraints={updateMachineConstraints}
        updateMachineSeries={updateMachineSeries} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="machine-view__list">
        <juju.components.MachineViewMachine
          acl={acl}
          destroyMachines={destroyMachines}
          dropUnit={instance._dropUnit}
          generateMachineDetails={generateMachineDetails}
          key="new0"
          machine={{
            displayName: 'new0',
            id: 'new0'
          }}
          machineModel={{get: sinon.stub()}}
          parseConstraints={parseConstraints}
          providerType="aws"
          selected={false}
          selectMachine={instance.selectMachine}
          series={['wily']}
          services={services}
          showConstraints={true}
          type="machine"
          units={units}
          updateMachineConstraints={updateMachineConstraints}
          updateMachineSeries={updateMachineSeries} />
        <juju.components.MachineViewMachine
          acl={acl}
          destroyMachines={destroyMachines}
          dropUnit={instance._dropUnit}
          generateMachineDetails={generateMachineDetails}
          key="new5"
          machine={{
            displayName: 'new5',
            id: 'new5'
          }}
          machineModel={{get: sinon.stub()}}
          parseConstraints={parseConstraints}
          providerType="aws"
          selected={true}
          selectMachine={instance.selectMachine}
          series={['wily']}
          services={services}
          showConstraints={true}
          type="machine"
          units={units}
          updateMachineConstraints={updateMachineConstraints}
          updateMachineSeries={updateMachineSeries} />
      </ul>);
    expect(
      output.props.children.props.children[1].props.children[1]
      .props.children[1]).toEqualJSX(expected);
  });

  it('can toggle constraints on machines', function() {
    const machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    const filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([]);
    const machines = {
      filterByParent: filterByParent,
      getById: sinon.stub(),
      revive: sinon.stub().returns({get: sinon.stub()})
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const updateMachineConstraints = sinon.stub();
    const updateMachineSeries = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        providerType="aws"
        removeUnits={sinon.stub()}
        series={['wily']}
        services={services}
        units={units}
        updateMachineConstraints={updateMachineConstraints}
        updateMachineSeries={updateMachineSeries} />, true);
    const instance = renderer.getMountedInstance();
    instance._toggleConstraints();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="machine-view__list">
        <juju.components.MachineViewMachine
          acl={acl}
          destroyMachines={destroyMachines}
          dropUnit={instance._dropUnit}
          generateMachineDetails={generateMachineDetails}
          key="new0"
          machine={machineList[0]}
          machineModel={{get: sinon.stub()}}
          parseConstraints={parseConstraints}
          providerType="aws"
          selected={true}
          selectMachine={instance.selectMachine}
          services={services}
          series={['wily']}
          showConstraints={true}
          type="machine"
          units={units}
          updateMachineConstraints={updateMachineConstraints}
          updateMachineSeries={updateMachineSeries} />
        <juju.components.MachineViewMachine
          acl={acl}
          destroyMachines={destroyMachines}
          dropUnit={instance._dropUnit}
          generateMachineDetails={generateMachineDetails}
          key="new1"
          machine={machineList[1]}
          machineModel={{get: sinon.stub()}}
          parseConstraints={parseConstraints}
          providerType="aws"
          selected={false}
          selectMachine={instance.selectMachine}
          series={['wily']}
          services={services}
          showConstraints={false}
          type="machine"
          units={units}
          updateMachineConstraints={updateMachineConstraints}
          updateMachineSeries={updateMachineSeries} />
      </ul>);
    expect(
      output.props.children.props.children[1].props.children[1]
      .props.children[1]).toEqualJSX(expected);
  });

  it('can display a form for adding a machine', function() {
    const machines = {
      filterByParent: sinon.stub().returns([]),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const createMachine = sinon.stub();
    const placeUnit = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={placeUnit}
        providerType={'azure'}
        removeUnits={sinon.stub()}
        series={['trusty', 'xenial']}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance._addMachine();
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.MachineViewAddMachine
        acl={acl}
        close={instance._closeAddMachine}
        createMachine={createMachine}
        placeUnit={placeUnit}
        providerType={'azure'}
        selectMachine={instance.selectMachine}
        series={['trusty', 'xenial']}
        unit={null} />);
    expect(
      output.props.children.props.children[1].props.children[0]).toEqualJSX(
        expected);
  });

  it('can select a machine', function() {
    const machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    const machines = {
      filterByParent: sinon.stub().returns(machineList),
      getById: sinon.stub(),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    assert.equal(instance.state.selectedMachine, 'new0');
    instance.selectMachine('new1');
    assert.equal(instance.state.selectedMachine, 'new1');
  });

  it('can display a list of containers', function() {
    const machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    const filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([{
      id: 'new0/lxc/0'
    }]);
    const machines = {
      filterByParent: filterByParent,
      getById: sinon.stub().returns({
        id: 'new0',
        commitStatus: 'committed'
      }),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const removeUnits = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={removeUnits}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="machine-view__list">
        <juju.components.MachineViewMachine
          acl={acl}
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
          acl={acl}
          destroyMachines={destroyMachines}
          dropUnit={instance._dropUnit}
          key="new0/lxc/0"
          machine={{id: 'new0/lxc/0'}}
          removeUnit={instance._removeUnit}
          services={services}
          type="container"
          units={units} />
      </ul>);
    expect(
      output.props.children.props.children[2].props.children[1]).toEqualJSX(
        expected);
  });

  it('can order a list of containers', function() {
    const machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    const filterByParent = sinon.stub();
    filterByParent.returns(machineList);
    filterByParent.withArgs('new0').returns([{
      displayName: 'new0/lxc/5',
      id: 'new0/lxc/5'
    }, {
      displayName: 'new0/lxc/0',
      id: 'new0/lxc/0'
    }]);
    const machines = {
      filterByParent: filterByParent,
      getById: sinon.stub().returns({
        id: 'new0',
        commitStatus: 'committed'
      }),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const removeUnits = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={removeUnits}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="machine-view__list">
        <juju.components.MachineViewMachine
          acl={acl}
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
          acl={acl}
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
          acl={acl}
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
      </ul>);
    expect(
      output.props.children.props.children[2].props.children[1]).toEqualJSX(
        expected);
  });

  it('can display a form for adding a container', function() {
    const machines = {
      filterByParent: function(arg) {
        if (arg == 'new0') {
          return [{id: 'new0/lxc/0'}];
        }
        return [{id: 'new0'}];
      },
      getById: sinon.stub().returns({
        id: 'new0',
        commitStatus: 'committed'
      }),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const createMachine = sinon.stub();
    const destroyMachines = sinon.stub();
    const placeUnit = sinon.stub();
    const removeUnits = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={placeUnit}
        providerType={'gce'}
        removeUnits={removeUnits}
        series={['trusty', 'xenial']}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance._addContainer();
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.MachineViewAddMachine
        acl={acl}
        close={instance._closeAddContainer}
        createMachine={createMachine}
        parentId="new0"
        placeUnit={placeUnit}
        providerType={'gce'}
        series={['trusty', 'xenial']}
        unit={null} />);
    expect(
      output.props.children.props.children[2].props.children[0]).toEqualJSX(
        expected);
  });

  it('does not show an add container form for deleted machines', function() {
    const machines = {
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
      }),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const createMachine = sinon.stub();
    const destroyMachines = sinon.stub();
    const removeUnits = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        units={units}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={removeUnits}
        services={services}
        machines={machines}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance._addContainer();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="machine-view__list">
        <juju.components.MachineViewMachine
          acl={acl}
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
          acl={acl}
          destroyMachines={destroyMachines}
          dropUnit={instance._dropUnit}
          key="new0/lxc/0"
          machine={{id: 'new0/lxc/0'}}
          removeUnit={instance._removeUnit}
          services={services}
          type="container"
          units={units} />
      </ul>);
    expect(
      output.props.children.props.children[2].props.children[1]).toEqualJSX(
        expected);
  });

  it('can remove a unit', function() {
    const machines = {
      filterByParent: function(arg) {
        if (arg == 'new0') {
          return [{id: 'new0/lxc/0'}];
        }
        return [{id: 'new0'}];
      },
      getById: sinon.stub(),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const createMachine = sinon.stub();
    const destroyMachines = sinon.stub();
    const removeUnits = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={sinon.stub()}
        removeUnits={removeUnits}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance._removeUnit('wordpress/8');
    assert.equal(removeUnits.callCount, 1);
    assert.deepEqual(removeUnits.args[0][0], ['wordpress/8']);
  });

  it('can place a unit on a machine', function() {
    const machines = {
      filterByParent: function(arg) {
        if (arg == 'new0') {
          return [{id: 'new0/lxc/0'}];
        }
        return [{id: 'new0'}];
      },
      getById: sinon.stub(),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const createMachine = sinon.stub();
    const destroyMachines = sinon.stub();
    const placeUnit = sinon.stub();
    const removeUnits = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={createMachine}
        destroyMachines={destroyMachines}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={placeUnit}
        removeUnits={removeUnits}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance._dropUnit('wordpress/8', 'new0');
    assert.equal(placeUnit.callCount, 1);
    assert.deepEqual(placeUnit.args[0][0], 'wordpress/8');
    assert.equal(placeUnit.args[0][1], 'new0');
  });

  it('can disable menu actions when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const machines = {
      filterByParent: sinon.stub().returns([]),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const services = {
      size: sinon.stub().returns(0)
    };
    const placeUnit = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineView.DecoratedComponent
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachine={sinon.stub()}
        destroyMachines={sinon.stub()}
        environmentName="My Env"
        generateMachineDetails={generateMachineDetails}
        machines={machines}
        parseConstraints={parseConstraints}
        placeUnit={placeUnit}
        removeUnits={sinon.stub()}
        services={services}
        units={units}
        updateMachineConstraints={sinon.stub()}
        updateMachineSeries={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const machineMenuItems = output.props.children.props.children[1]
      .props.menuItems;
    const containerMenuItems = output.props.children.props.children[2]
      .props.menuItems;
    assert.isFalse(machineMenuItems[0].action);
    assert.isFalse(containerMenuItems[0].action);
  });
});

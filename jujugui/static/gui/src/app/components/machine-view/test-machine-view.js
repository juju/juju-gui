/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const MachineView = require('./machine-view');
const MachineViewColumn = require('./column/column');
const SvgIcon = require('../svg-icon/svg-icon');

describe('MachineView', function() {
  let acl, dbAPI, machineList, machines, modelAPI, parseMachineName, units;

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={options.acl || acl}
        changeState={options.changeState || sinon.stub()}
        dbAPI={options.dbAPI || dbAPI}
        machine={options.machine === undefined ? 'new0' : options.machine}
        modelAPI={options.modelAPI || modelAPI}
        parseConstraints={options.parseConstraints || sinon.stub()}
        parseMachineDetails={options.parseMachineDetails || sinon.stub()}
        parseMachineName={options.parseMachineName || parseMachineName}
        sendAnalytics={options.sendAnalytics || sinon.stub()} />,
      {disableLifecycleMethods: true}
    );
    const instance = wrapper.instance();
    const column = document.createElement('div');
    column.innerHTML = '<div className="machine-view__column-content"></div>';
    instance.refs = {
      containersColumn: column,
      machinesColumn: column
    };
    instance.componentDidMount();
    return wrapper;
  };

  beforeEach(function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => false}));
    parseMachineName = sinon.stub().returns({
      parentId: null,
      containerType: null,
      number: 'new0'
    });
    units = [{
      id: 'django/0',
      service: 'django'
    }, {
      id: 'django/1',
      service: 'django'
    }];
    machineList = [{
      displayName: 'new0',
      id: 'new0'
    }, {
      displayName: 'new1',
      id: 'new1'
    }];
    machines = {
      filterByParent: sinon.stub().returns([]),
      getById: sinon.stub(),
      revive: sinon.stub()
    };
    const getStub = sinon.stub();
    getStub.withArgs('icon').returns('django.svg');
    getStub.withArgs('subordinate').returns(false);
    dbAPI = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      applications: {
        getById: sinon.stub().returns({
          get: getStub
        }),
        size: sinon.stub().returns(0)
      },
      machines: machines,
      modelName: 'My Model',
      units: {
        filterByMachine: sinon.stub().returns([])
      }
    });
    modelAPI = shapeup.addReshape({
      autoPlaceUnits: sinon.stub(),
      createMachine: sinon.stub(),
      destroyMachines: sinon.stub(),
      placeUnit: sinon.stub(),
      providerType: 'azure',
      removeUnits: sinon.stub(),
      updateMachineConstraints: sinon.stub(),
      updateMachineSeries: sinon.stub()
    });
  });

  it('can render', function() {
    const wrapper = renderComponent();
    const columns = wrapper.find('DropTarget(MachineViewColumn)');
    const machineMenuItems = columns.at(1).prop('menuItems');
    const containerMenuItems = columns.at(2).prop('menuItems');
    const links = wrapper.find('.link');
    const expected = (
      <div className="machine-view">
        <div className="machine-view__content">
          <MachineViewColumn
            acl={acl}
            droppable={false}
            sendAnalytics={sinon.stub()}
            title="New units"
            toggle={{
              action: columns.at(0).prop('toggle').action,
              disabled: true,
              toggleOn: false
            }}>
            {undefined}
            <div className="machine-view__column-onboarding">
              <div>
                <p>
                  Unplaced units will appear here. Drag and drop them to
                  customise your deployment.
                </p>
                <span
                  className="link"
                  onClick={links.at(0).prop('onClick')}>
                  Add applications to get started
                </span>
              </div>
            </div>
          </MachineViewColumn>
          <MachineViewColumn
            acl={acl}
            activeMenuItem="name"
            droppable={true}
            dropUnit={columns.at(1).prop('dropUnit')}
            menuItems={[{
              label: 'Add machine',
              action: machineMenuItems[0].action
            }, {
              label: 'Hide constraints',
              action: machineMenuItems[1].action
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
            ref="machinesColumn"
            sendAnalytics={sinon.stub()}
            title="My Model (0)"
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
                <li>Colocate applications</li>
              </ul>
              <span
                className="link"
                onClick={links.at(1).prop('onClick')}
                role="button"
                tabIndex="0">
                Add machine
              </span>
            </div>
          </MachineViewColumn>
          <MachineViewColumn
            acl={acl}
            activeMenuItem="name"
            droppable={true}
            dropUnit={columns.at(2).prop('dropUnit')}
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
            ref="containersColumn"
            sendAnalytics={sinon.stub()}
            title="0 containers, 0 units"
            type="container">
            {undefined}
            {undefined}
          </MachineViewColumn>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display onboarding if there are no applications', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="machine-view__column-onboarding">
        <div>
          <p>
            Unplaced units will appear here. Drag and drop them to
            customise your deployment.
          </p>
          <span
            className="link"
            onClick={
              wrapper.find('.machine-view__column-onboarding .link').at(0).prop('onClick')}>
            Add applications to get started
          </span>
        </div>
      </div>);
    assert.compareJSX(
      wrapper.find('.machine-view__column-onboarding').at(0), expected);
  });

  it('can open the store from the onboarding', function() {
    const changeState = sinon.stub();
    const wrapper = renderComponent({changeState});
    wrapper.find('.machine-view__column-onboarding .link').at(0).props().onClick();
    assert.equal(changeState.callCount, 2);
    assert.deepEqual(changeState.args[1][0], {store: ''});
  });

  it('can display onboarding if there are no unplaced units', function() {
    dbAPI.applications.size.returns(1);
    const wrapper = renderComponent();
    const expected = (
      <div className="machine-view__column-onboarding">
        <SvgIcon
          name="task-done_16"
          size="16" />
        You have placed all of your units
      </div>);
    assert.compareJSX(
      wrapper.find('.machine-view__column-onboarding').at(0), expected);
  });

  it('can display a service scale up form', function() {
    dbAPI.applications.size.returns(1);
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._toggleScaleUp();
    wrapper.update();
    assert.equal(wrapper.find('MachineViewScaleUp').length, 1);
  });

  it('can display a list of unplaced units', function() {
    dbAPI.units.filterByMachine.returns(units);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('DragSource(MachineViewUnplacedUnit)').length, 2);
  });

  it('does not display unplaced subordinate units', function() {
    const getStub = sinon.stub();
    getStub.withArgs('icon').returns('django.svg');
    getStub.withArgs('subordinate').onFirstCall().returns(false)
      .onSecondCall().returns(true);
    dbAPI.units.filterByMachine.returns(units);
    dbAPI.applications.getById = sinon.stub().returns({
      get: getStub
    });
    const wrapper = renderComponent();
    assert.equal(wrapper.find('DragSource(MachineViewUnplacedUnit)').length, 1);
  });

  it('displays onboarding if there are only subordinate units', function() {
    const getStub = sinon.stub();
    getStub.withArgs('icon').returns('django.svg');
    getStub.withArgs('subordinate').returns(true);
    dbAPI.units.filterByMachine.returns(units);
    dbAPI.applications.getById = sinon.stub().returns({
      get: getStub
    });
    dbAPI.applications.size.returns(1);
    const wrapper = renderComponent();
    const expected = (
      <div className="machine-view__column-onboarding">
        <SvgIcon
          name="task-done_16"
          size="16" />
        You have placed all of your units
      </div>);
    assert.compareJSX(
      wrapper.find('.machine-view__column-onboarding').at(0), expected);
  });

  it('can auto place units', function() {
    dbAPI.units.filterByMachine.returns(units);
    dbAPI.applications.size.returns(1);
    const wrapper = renderComponent();
    wrapper.find('Button').props().action();
    assert.equal(modelAPI.autoPlaceUnits.callCount, 1);
  });

  it('can disable auto place when read only', function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => true}));
    dbAPI.units.filterByMachine.returns(units);
    dbAPI.applications.size.returns(1);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('Button').prop('disabled'), true);
  });

  it('can display onboarding if there are no machines', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="machine-view__column-onboarding">
        <p>Use machine view to:</p>
        <ul>
          <li>Create machines</li>
          <li>Create containers</li>
          <li>Customise placement</li>
          <li>Scale up your model</li>
          <li>Manually place new units</li>
          <li>Colocate applications</li>
        </ul>
        <span
          className="link"
          onClick={wrapper.find('.link').at(1).prop('onClick')}
          role="button"
          tabIndex="0">
          Add machine
        </span>
      </div>);
    assert.compareJSX(
      wrapper.find('.machine-view__column-onboarding').at(1), expected);
  });

  it('can display onboarding if there is one machine', function() {
    const machineList = [{
      displayName: 'new0',
      id: 'new0'
    }];
    dbAPI.machines.filterByParent.returns(machineList);
    const wrapper = renderComponent();
    const expected = (
      <div className="machine-view__column-onboarding">
        Drag and drop unplaced units onto your machines and containers to
        customise your deployment.
      </div>);
    assert.compareJSX(
      wrapper.find('.machine-view__column-onboarding').at(1), expected);
  });

  it('can display a list of machines', function() {
    dbAPI.machines.filterByParent.returns(machineList);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('DropTarget(MachineViewMachine)').length, 2);
  });

  it('can order a list of machines', function() {
    const machineList = [{
      displayName: 'new5',
      id: 'new5'
    }, {
      displayName: 'new0',
      id: 'new0'
    }];
    dbAPI.machines.filterByParent.returns(machineList);
    const wrapper = renderComponent();
    const machines = wrapper.find('DropTarget(MachineViewMachine)');
    assert.equal(machines.at(0).prop('machineAPI').machine.id, 'new0');
    assert.equal(machines.at(1).prop('machineAPI').machine.id, 'new5');
  });

  it('can toggle constraints on machines', function() {
    dbAPI.machines.filterByParent.returns(machineList);
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._toggleConstraints();
    wrapper.update();
    const machines = wrapper.find('DropTarget(MachineViewMachine)');
    // The selected machines should still show constraints.
    assert.equal(machines.at(0).prop('showConstraints'), true);
    assert.equal(machines.at(1).prop('showConstraints'), false);
  });

  it('can display a form for adding a machine', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._addMachine();
    wrapper.update();
    assert.equal(wrapper.find('MachineViewAddMachine').length, 1);
  });

  it('can select a machine', function() {
    const changeState = sinon.stub();
    const wrapper = renderComponent({changeState});
    const instance = wrapper.instance();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {gui: {machines: 'new0'}});
    instance.selectMachine('new1');
    assert.equal(changeState.callCount, 2);
    assert.deepEqual(changeState.args[1][0], {gui: {machines: 'new1'}});
  });

  it('selects the given machine on mount', function() {
    const changeState = sinon.stub();
    renderComponent({
      changeState,
      machine: 'new1'
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {gui: {machines: 'new1'}});
  });

  it('does not select any machines on mount if there are none', function() {
    dbAPI.machines.filterByParent.returns([]);
    const changeState = sinon.stub();
    renderComponent({
      changeState,
      machine: ''
    });
    assert.equal(changeState.callCount, 0);
  });

  it('can display a list of containers', function() {
    dbAPI.machines.filterByParent.returns(machineList);
    dbAPI.machines.filterByParent.withArgs('new0').returns([{
      id: 'new0/lxc/0'
    }]);
    dbAPI.machines.getById.returns({
      id: 'new0',
      commitStatus: 'committed'
    });
    const wrapper = renderComponent();
    const containers = wrapper.find('.machine-view__list').at(1)
      .find('DropTarget(MachineViewMachine)');
    assert.equal(containers.length, 2);
    assert.equal(containers.at(0).prop('machineAPI').machine.id, 'new0');
    assert.equal(containers.at(0).prop('machineAPI').machine.root, true);
    assert.equal(containers.at(1).prop('machineAPI').machine.id, 'new0/lxc/0');
  });

  it('can order a list of containers', function() {
    dbAPI.machines.filterByParent.returns(machineList);
    dbAPI.machines.filterByParent.withArgs('new0').returns([{
      displayName: 'new0/lxc/5',
      id: 'new0/lxc/5'
    }, {
      displayName: 'new0/lxc/0',
      id: 'new0/lxc/0'
    }]);
    dbAPI.machines.getById.returns({
      id: 'new0',
      commitStatus: 'committed'
    });
    const wrapper = renderComponent();
    const containers = wrapper.find('.machine-view__list').at(1)
      .find('DropTarget(MachineViewMachine)');
    assert.equal(containers.at(1).prop('machineAPI').machine.id, 'new0/lxc/0');
    assert.equal(containers.at(2).prop('machineAPI').machine.id, 'new0/lxc/5');
  });

  it('can display a form for adding a container', function() {
    dbAPI.machines.getById.returns({
      id: 'new0',
      commitStatus: 'committed'
    });
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._addContainer();
    wrapper.update();
    assert.equal(wrapper.find('MachineViewAddMachine').length, 1);
  });

  it('does not show an add container form for deleted machines', function() {
    dbAPI.machines.getById.returns({
      id: 'new0',
      commitStatus: 'committed',
      deleted: true
    });
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._addContainer();
    wrapper.update();
    assert.equal(wrapper.find('MachineViewAddMachine').length, 0);
  });

  it('can remove a unit', function() {
    dbAPI.machines.filterByParent.withArgs('new0').returns([{
      displayName: 'new0/lxc/0',
      id: 'new0/lxc/0'
    }]);
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._removeUnit('wordpress/8');
    const removeUnits = modelAPI.removeUnits;
    assert.equal(removeUnits.callCount, 1);
    assert.deepEqual(removeUnits.args[0][0], ['wordpress/8']);
  });

  it('can place a unit on a machine', function() {
    dbAPI.machines.filterByParent.withArgs('new0').returns([{
      displayName: 'new0/lxc/0',
      id: 'new0/lxc/0'
    }]);
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    const placeUnit = modelAPI.placeUnit;
    instance._dropUnit('wordpress/8', 'new0');
    assert.equal(placeUnit.callCount, 1);
    assert.equal(placeUnit.args[0][0], 'wordpress/8');
    assert.equal(placeUnit.args[0][1], 'new0');
  });

  it('can disable menu actions when read only', function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => true}));
    const wrapper = renderComponent();
    const columns = wrapper.find('DropTarget(MachineViewColumn)');
    assert.equal(columns.at(1).prop('menuItems')[0].action, false);
    assert.equal(columns.at(2).prop('menuItems')[0].action, false);
  });
});

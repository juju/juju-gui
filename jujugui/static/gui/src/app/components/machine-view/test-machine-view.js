/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const shapeup = require('shapeup');

const MachineView = require('./machine-view');
const MachineViewAddMachine = require('./add-machine/add-machine');
const MachineViewColumn = require('./column/column');
const MachineViewMachine = require('./machine/machine');
const MachineViewScaleUp = require('./scale-up/scale-up');
const MachineViewUnplacedUnit = require('./unplaced-unit/unplaced-unit');
const SvgIcon = require('../svg-icon/svg-icon');
const GenericButton = require('../generic-button/generic-button');

const jsTestUtils = require('../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

function queryComponentSelector(component, selector, all) {
  var queryFn = (all) ? 'querySelectorAll' : 'querySelector';
  return ReactDOM.findDOMNode(component)[queryFn](selector);
}

describe('MachineView', function() {
  let acl, generateMachineDetails, machines, parseConstraints,
      parseMachineName, sendAnalytics;

  beforeEach(function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => false}));
    parseConstraints = sinon.stub();
    parseMachineName = sinon.stub().returns({
      parentId: null,
      containerType: null,
      number: 'new0'
    });
    sendAnalytics = sinon.stub();
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
      getById: sinon.stub(),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const applications = {
      size: sinon.stub().returns(0)
    };
    const placeUnit = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={{
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          reshape: sinon.stub(),
          units: units
        }}
        generateMachineDetails={generateMachineDetails}
        machine=""
        modelAPI={{
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: placeUnit,
          removeUnits: sinon.stub(),
          reshape: shapeup.reshapeFunc,
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        }}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const machineMenuItems = output.props.children.props.children[1]
      .props.menuItems;
    const containerMenuItems = output.props.children.props.children[2]
      .props.menuItems;
    const expected = (
      <div className="machine-view">
        <div className="machine-view__content">
          <MachineViewColumn
            acl={acl}
            droppable={false}
            sendAnalytics={sendAnalytics}
            title="New units"
            toggle={{
              action: instance._toggleScaleUp,
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
                <span className="link"
                  onClick={instance._openStore}>
                  Add applications to get started
                </span>
              </div>
            </div>
          </MachineViewColumn>
          <MachineViewColumn
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
            ref="machinesColumn"
            sendAnalytics={sendAnalytics}
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
              <span className="link"
                onClick={instance._addMachine}
                role="button"
                tabIndex="0">
                Add machine
              </span>
            </div>
          </MachineViewColumn>
          <MachineViewColumn
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
            ref="containersColumn"
            sendAnalytics={sendAnalytics}
            title="0 containers, 0 units"
            type="container">
            {undefined}
            {undefined}
          </MachineViewColumn>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display onboarding if there are no applications', function() {
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const applications = {
      size: sinon.stub().returns(0)
    };
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="machine-view__column-onboarding">
        <div>
          <p>
            Unplaced units will appear here. Drag and drop them to
            customise your deployment.
          </p>
          <span className="link"
            onClick={instance._openStore}>
            Add applications to get started
          </span>
        </div>
      </div>);
    expect(
      output.props.children.props.children[0].props.children[1]).toEqualJSX(
      expected);
  });

  it('can open the store from the onboarding', function() {
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const applications = {
      size: sinon.stub().returns(0)
    };
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={changeState}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
    const output = renderer.getRenderOutput();
    output.props.children.props.children[0].props.children[1].props.children[1]
      .props.children[1].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {store: ''});
  });

  it('can display onboarding if there are no unplaced units', function() {
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const applications = {
      size: sinon.stub().returns(1)
    };
    const output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />);
    const expected = (
      <div className="machine-view__column-onboarding">
        <SvgIcon name="task-done_16"
          size="16" />
        You have placed all of your units
      </div>);
    expect(
      output.props.children.props.children[0].props.children[1]).toEqualJSX(
      expected);
  });

  it('can display a service scale up form', function() {
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const applications = {
      size: sinon.stub().returns(1)
    };
    const dbAPI = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      applications: applications,
      machines: machines,
      modelName: 'My Model',
      units: units
    });
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={dbAPI}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
    const instance = renderer.getMountedInstance();
    instance._toggleScaleUp();
    const output = renderer.getRenderOutput();
    const propTypes = MachineViewScaleUp.propTypes;
    const expected = (
      <MachineViewScaleUp
        acl={acl.reshape(propTypes.acl)}
        dbAPI={dbAPI.reshape(propTypes.dbAPI)}
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
    const applications = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: getStub
      })
    };
    const dbAPI = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      applications: applications,
      machines: machines,
      modelName: 'My Model',
      units: units
    });
    const modelAPI = shapeup.addReshape({
      autoPlaceUnits: autoPlaceUnits,
      createMachine: createMachine,
      destroyMachines: sinon.stub(),
      placeUnit: placeUnit,
      providerType: 'azure',
      removeUnits: removeUnits,
      updateMachineConstraints: sinon.stub(),
      updateMachineSeries: sinon.stub()
    });
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={dbAPI}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={modelAPI}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics}
        series={['trusty', 'xenial']} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const propTypes = (
      MachineViewUnplacedUnit.DecoratedComponent.propTypes);
    const expected = (
      <ul className="machine-view__list">
        <MachineViewUnplacedUnit
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          key="django/0"
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          sendAnalytics={sendAnalytics}
          series={['trusty', 'xenial']}
          unitAPI={{
            icon: 'django.svg',
            removeUnit: instance._removeUnit,
            selectMachine: instance.selectMachine,
            unit: unitList[0]
          }} />
        <MachineViewUnplacedUnit
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          key="django/1"
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          sendAnalytics={sendAnalytics}
          series={['trusty', 'xenial']}
          unitAPI={{
            icon: 'django.svg',
            removeUnit: instance._removeUnit,
            selectMachine: instance.selectMachine,
            unit: unitList[1]
          }} />
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
    const applications = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: getStub
      })
    };
    const dbAPI = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      applications: applications,
      machines: machines,
      modelName: 'My Model',
      units: units
    });
    const modelAPI = shapeup.addReshape({
      autoPlaceUnits: autoPlaceUnits,
      createMachine: createMachine,
      destroyMachines: sinon.stub(),
      placeUnit: placeUnit,
      providerType: 'azure',
      removeUnits: removeUnits,
      updateMachineConstraints: sinon.stub(),
      updateMachineSeries: sinon.stub()
    });
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={dbAPI}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={modelAPI}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics}
        series={['trusty', 'xenial']} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const propTypes = (
      MachineViewUnplacedUnit.DecoratedComponent.propTypes);
    const expected = (
      <ul className="machine-view__list">
        {[<MachineViewUnplacedUnit
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          key="django/0"
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          sendAnalytics={sendAnalytics}
          series={['trusty', 'xenial']}
          unitAPI={{
            icon: 'django.svg',
            removeUnit: instance._removeUnit,
            selectMachine: instance.selectMachine,
            unit: unitList[0]
          }} />]}
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
    const applications = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: getStub
      })
    };
    const output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />);
    const expected = (
      <div className="machine-view__column-onboarding">
        <SvgIcon name="task-done_16"
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
    const applications = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: getStub
      })
    };
    const component = testUtils.renderIntoDocument(
      <MachineView
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine=""
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: autoPlaceUnits,
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />);
    const node = queryComponentSelector(component,
      '.machine-view__auto-place .button--inline-neutral');
    testUtils.Simulate.click(node);
    assert.equal(autoPlaceUnits.callCount, 1);
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
  });

  it('can disable auto place when read only', function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => true}));
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
    const applications = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: getStub
      })
    };
    const output = jsTestUtils.shallowRender(
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: autoPlaceUnits,
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />);
    const expected = (
      <GenericButton
        action={autoPlaceUnits}
        disabled={true}
        type="inline-neutral">
        Auto place
      </GenericButton>);
    expect(
      output.props.children.props.children[0].props.children[1].props
        .children[0].props.children[0]).toEqualJSX(expected);
  });

  it('can display onboarding if there are no machines', function() {
    const machines = {
      filterByParent: sinon.stub().returns([]),
      getById: sinon.stub(),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const applications = {
      size: sinon.stub().returns(0)
    };
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine=""
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
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
          <li>Colocate applications</li>
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: destroyMachines,
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const dbAPI = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      applications: applications,
      machines: machines,
      modelName: 'My Model',
      units: units
    });
    const modelAPI = shapeup.addReshape({
      autoPlaceUnits: sinon.stub(),
      createMachine: sinon.stub(),
      destroyMachines: destroyMachines,
      placeUnit: sinon.stub(),
      providerType: 'aws',
      removeUnits: sinon.stub(),
      updateMachineConstraints: sinon.stub(),
      updateMachineSeries: sinon.stub()
    });
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={dbAPI}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={modelAPI}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics}
        series={['wily']} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const propTypes = (
      MachineViewMachine.DecoratedComponent.propTypes);
    const expected = (
      <ul className="machine-view__list">
        <MachineViewMachine
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={instance._dropUnit}
          key="new0"
          machineAPI={{
            generateMachineDetails: generateMachineDetails,
            machine: machineList[0],
            selected: true,
            selectMachine: instance.selectMachine,
            series: ['wily']
          }}
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={parseConstraints}
          ref="machine-new0"
          sendAnalytics={sendAnalytics}
          showConstraints={true}
          type="machine" />
        <MachineViewMachine
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={instance._dropUnit}
          key="new1"
          machineAPI={{
            generateMachineDetails: generateMachineDetails,
            machine: machineList[1],
            selected: false,
            selectMachine: instance.selectMachine,
            series: ['wily']
          }}
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={parseConstraints}
          ref="machine-new1"
          sendAnalytics={sendAnalytics}
          showConstraints={true}
          type="machine" />
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const updateMachineConstraints = sinon.stub();
    const updateMachineSeries = sinon.stub();
    const dbAPI = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      applications: applications,
      machines: machines,
      modelName: 'My Model',
      units: units
    });
    const modelAPI = shapeup.addReshape({
      autoPlaceUnits: sinon.stub(),
      createMachine: sinon.stub(),
      destroyMachines: destroyMachines,
      placeUnit: sinon.stub(),
      providerType: 'aws',
      removeUnits: sinon.stub(),
      updateMachineConstraints: updateMachineConstraints,
      updateMachineSeries: updateMachineSeries
    });
    const renderer = jsTestUtils.shallowRender(
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={dbAPI}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={modelAPI}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics}
        series={['wily']} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const propTypes = (
      MachineViewMachine.DecoratedComponent.propTypes);
    const expected = (
      <ul className="machine-view__list">
        <MachineViewMachine
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={instance._dropUnit}
          key="new0"
          machineAPI={{
            generateMachineDetails: generateMachineDetails,
            machine: {
              displayName: 'new0',
              id: 'new0'
            },
            selected: true,
            selectMachine: instance.selectMachine,
            series: ['wily']
          }}
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={parseConstraints}
          ref="machine-new0"
          sendAnalytics={sendAnalytics}
          showConstraints={true}
          type="machine" />
        <MachineViewMachine
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={instance._dropUnit}
          key="new5"
          machineAPI={{
            generateMachineDetails: generateMachineDetails,
            machine: {
              displayName: 'new5',
              id: 'new5'
            },
            selected: false,
            selectMachine: instance.selectMachine,
            series: ['wily']
          }}
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={parseConstraints}
          ref="machine-new5"
          sendAnalytics={sendAnalytics}
          showConstraints={true}
          type="machine" />
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const updateMachineConstraints = sinon.stub();
    const updateMachineSeries = sinon.stub();
    const dbAPI = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      applications: applications,
      machines: machines,
      modelName: 'My Model',
      units: units
    });
    const modelAPI = shapeup.addReshape({
      autoPlaceUnits: sinon.stub(),
      createMachine: sinon.stub(),
      destroyMachines: destroyMachines,
      placeUnit: sinon.stub(),
      providerType: 'aws',
      removeUnits: sinon.stub(),
      updateMachineConstraints: updateMachineConstraints,
      updateMachineSeries: updateMachineSeries
    });
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={dbAPI}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={modelAPI}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics}
        series={['wily']} />, true);
    const instance = renderer.getMountedInstance();
    instance._toggleConstraints();
    const output = renderer.getRenderOutput();
    const propTypes = (
      MachineViewMachine.DecoratedComponent.propTypes);
    const expected = (
      <ul className="machine-view__list">
        <MachineViewMachine
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={instance._dropUnit}
          key="new0"
          machineAPI={{
            generateMachineDetails: generateMachineDetails,
            machine: machineList[0],
            selected: true,
            selectMachine: instance.selectMachine,
            series: ['wily']
          }}
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={parseConstraints}
          ref="machine-new0"
          sendAnalytics={sendAnalytics}
          showConstraints={true}
          type="machine" />
        <MachineViewMachine
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={instance._dropUnit}
          key="new1"
          machineAPI={{
            generateMachineDetails: generateMachineDetails,
            machine: machineList[1],
            selected: false,
            selectMachine: instance.selectMachine,
            series: ['wily']
          }}
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={parseConstraints}
          ref="machine-new1"
          sendAnalytics={sendAnalytics}
          showConstraints={false}
          type="machine" />
      </ul>);
    expect(
      output.props.children.props.children[1].props.children[1]
        .props.children[1]).toEqualJSX(expected);
  });

  it('can display a form for adding a machine', function() {
    const machines = {
      filterByParent: sinon.stub().returns([]),
      getById: sinon.stub(),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const applications = {
      size: sinon.stub().returns(0)
    };
    const createMachine = sinon.stub();
    const placeUnit = sinon.stub();
    const modelAPI = shapeup.addReshape({
      autoPlaceUnits: sinon.stub(),
      createMachine: createMachine,
      destroyMachines: sinon.stub(),
      placeUnit: placeUnit,
      providerType: 'azure',
      removeUnits: sinon.stub(),
      updateMachineConstraints: sinon.stub(),
      updateMachineSeries: sinon.stub()
    });
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={modelAPI}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics}
        series={['trusty', 'xenial']} />, true);
    const instance = renderer.getMountedInstance();
    instance._addMachine();
    const output = renderer.getRenderOutput();
    const propTypes = MachineViewAddMachine.propTypes;
    const expected = (
      <MachineViewAddMachine
        acl={acl.reshape(propTypes.acl)}
        close={instance._closeAddMachine}
        modelAPI={modelAPI.reshape(propTypes.modelAPI)}
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={changeState}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine=""
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
    const instance = renderer.getMountedInstance();
    const column = document.createElement('div');
    column.innerHTML = '<div className="machine-view__column-content"></div>';
    instance.refs = {
      containersColumn: column,
      machinesColumn: column
    };
    instance.componentDidMount();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {gui: {machines: 'new0'}});
    instance.selectMachine('new1');
    assert.equal(changeState.callCount, 2);
    assert.deepEqual(changeState.args[1][0], {gui: {machines: 'new1'}});
  });

  it('selects the given machine on mount', function() {
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={changeState}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new1"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName.returns({
          parentId: null,
          containerType: null,
          number: 'new1'
        })}
        sendAnalytics={sendAnalytics} />, true);
    const instance = renderer.getMountedInstance();
    const column = document.createElement('div');
    column.innerHTML = '<div className="machine-view__column-content"></div>';
    instance.refs = {
      containersColumn: column,
      machinesColumn: column
    };
    instance.componentDidMount();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {gui: {machines: 'new1'}});
  });

  it('does not select any machines on mount if there are not', function() {
    const machineList = [];
    const machines = {filterByParent: sinon.stub().returns(machineList)};
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const applications = {
      size: sinon.stub().returns(0)
    };
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={changeState}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine=""
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: sinon.stub(),
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName.returns({
          parentId: null,
          containerType: null,
          number: 'new1'
        })}
        sendAnalytics={sendAnalytics} />, true);
    const instance = renderer.getMountedInstance();
    instance.componentDidMount();
    assert.equal(changeState.callCount, 0);
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const removeUnits = sinon.stub();
    const dbAPI = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      applications: applications,
      machines: machines,
      modelName: 'My Model',
      units: units
    });
    const modelAPI = shapeup.addReshape({
      autoPlaceUnits: sinon.stub(),
      createMachine: sinon.stub(),
      destroyMachines: destroyMachines,
      placeUnit: sinon.stub(),
      removeUnits: removeUnits,
      updateMachineConstraints: sinon.stub(),
      updateMachineSeries: sinon.stub()
    });

    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={dbAPI}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={modelAPI}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const propTypes = (
      MachineViewMachine.DecoratedComponent.propTypes);
    const expected = (
      <ul className="machine-view__list">
        <MachineViewMachine
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={instance._dropUnit}
          key="new0"
          machineAPI={{
            machine: {
              commitStatus: 'committed',
              deleted: undefined,
              displayName: 'Root container',
              id: 'new0',
              root: true
            },
            removeUnit: instance._removeUnit,
            selectMachine: sinon.stub(),
            selected: true
          }}
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={parseConstraints}
          ref="container-new0"
          sendAnalytics={sendAnalytics}
          type="container" />
        <MachineViewMachine
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={instance._dropUnit}
          key="new0/lxc/0"
          machineAPI={{
            machine: {
              id: 'new0/lxc/0'
            },
            removeUnit: instance._removeUnit,
            selectMachine: sinon.stub(),
            selected: false
          }}
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={parseConstraints}
          ref="container-new0/lxc/0"
          sendAnalytics={sendAnalytics}
          type="container" />
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const destroyMachines = sinon.stub();
    const removeUnits = sinon.stub();
    const dbAPI = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      applications: applications,
      machines: machines,
      modelName: 'My Model',
      units: units
    });
    const modelAPI = shapeup.addReshape({
      autoPlaceUnits: sinon.stub(),
      createMachine: sinon.stub(),
      destroyMachines: destroyMachines,
      placeUnit: sinon.stub(),
      removeUnits: removeUnits,
      updateMachineConstraints: sinon.stub(),
      updateMachineSeries: sinon.stub()
    });
    const renderer = jsTestUtils.shallowRender(
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={dbAPI}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={modelAPI}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const propTypes = (
      MachineViewMachine.DecoratedComponent.propTypes);
    const reshapedACL = acl.reshape(propTypes.acl);
    const reshapedDBAPI = dbAPI.reshape(propTypes.dbAPI);
    const reshapedModelAPI = modelAPI.reshape(propTypes.modelAPI);
    const expected = (
      <ul className="machine-view__list">
        <MachineViewMachine
          acl={reshapedACL}
          dbAPI={reshapedDBAPI}
          dropUnit={instance._dropUnit}
          key="new0"
          machineAPI={{
            machine: {
              commitStatus: 'committed',
              deleted: undefined,
              displayName: 'Root container',
              id: 'new0',
              root: true
            },
            removeUnit: instance._removeUnit,
            selectMachine: sinon.stub(),
            selected: true
          }}
          modelAPI={reshapedModelAPI}
          parseConstraints={parseConstraints}
          ref="container-new0"
          sendAnalytics={sendAnalytics}
          type="container" />
        <MachineViewMachine
          acl={reshapedACL}
          dbAPI={reshapedDBAPI}
          dropUnit={instance._dropUnit}
          key="new0/lxc/0"
          machineAPI={{
            machine: {
              displayName: 'new0/lxc/0',
              id: 'new0/lxc/0'
            },
            removeUnit: instance._removeUnit,
            selectMachine: sinon.stub(),
            selected: false
          }}
          modelAPI={reshapedModelAPI}
          parseConstraints={parseConstraints}
          ref="container-new0/lxc/0"
          sendAnalytics={sendAnalytics}
          type="container" />
        <MachineViewMachine
          acl={reshapedACL}
          dbAPI={reshapedDBAPI}
          dropUnit={instance._dropUnit}
          key="new0/lxc/5"
          machineAPI={{
            machine: {
              displayName: 'new0/lxc/5',
              id: 'new0/lxc/5'
            },
            removeUnit: instance._removeUnit,
            selectMachine: sinon.stub(),
            selected: false
          }}
          modelAPI={reshapedModelAPI}
          parseConstraints={parseConstraints}
          ref="container-new0/lxc/5"
          sendAnalytics={sendAnalytics}
          type="container" />
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const createMachine = sinon.stub();
    const destroyMachines = sinon.stub();
    const placeUnit = sinon.stub();
    const removeUnits = sinon.stub();
    const modelAPI = shapeup.addReshape({
      autoPlaceUnits: sinon.stub(),
      createMachine: createMachine,
      destroyMachines: destroyMachines,
      placeUnit: placeUnit,
      providerType: 'gce',
      removeUnits: removeUnits,
      updateMachineConstraints: sinon.stub(),
      updateMachineSeries: sinon.stub()
    });
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={modelAPI}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics}
        series={['trusty', 'xenial']} />, true);
    const instance = renderer.getMountedInstance();
    instance._addContainer();
    const output = renderer.getRenderOutput();
    const propTypes = MachineViewAddMachine.propTypes;
    const expected = (
      <MachineViewAddMachine
        acl={acl.reshape(propTypes.acl)}
        close={instance._closeAddContainer}
        modelAPI={modelAPI.reshape(propTypes.modelAPI)}
        parentId="new0"
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const createMachine = sinon.stub();
    const destroyMachines = sinon.stub();
    const removeUnits = sinon.stub();
    const dbAPI = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      applications: applications,
      machines: machines,
      modelName: 'My Model',
      units: units
    });
    const modelAPI = shapeup.addReshape({
      autoPlaceUnits: sinon.stub(),
      createMachine: createMachine,
      destroyMachines: destroyMachines,
      placeUnit: sinon.stub(),
      removeUnits: removeUnits,
      updateMachineConstraints: sinon.stub(),
      updateMachineSeries: sinon.stub()
    });
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={dbAPI}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={modelAPI}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
    const instance = renderer.getMountedInstance();
    instance._addContainer();
    const output = renderer.getRenderOutput();
    const propTypes = (
      MachineViewMachine.DecoratedComponent.propTypes);
    const expected = (
      <ul className="machine-view__list">
        <MachineViewMachine
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={instance._dropUnit}
          key="new0"
          machineAPI={{
            machine: {
              commitStatus: 'committed',
              deleted: true,
              displayName: 'Root container',
              id: 'new0',
              root: true
            },
            removeUnit: instance._removeUnit,
            selectMachine: sinon.stub(),
            selected: true
          }}
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={parseConstraints}
          ref="container-new0"
          sendAnalytics={sendAnalytics}
          type="container" />
        <MachineViewMachine
          acl={acl.reshape(propTypes.acl)}
          dbAPI={dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={instance._dropUnit}
          key="new0/lxc/0"
          machineAPI={{
            machine: {id: 'new0/lxc/0'},
            removeUnit: instance._removeUnit,
            selectMachine: sinon.stub(),
            selected: false
          }}
          modelAPI={modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={parseConstraints}
          ref="container-new0/lxc/0"
          sendAnalytics={sendAnalytics}
          type="container" />
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const createMachine = sinon.stub();
    const destroyMachines = sinon.stub();
    const removeUnits = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: createMachine,
          destroyMachines: destroyMachines,
          placeUnit: sinon.stub(),
          removeUnits: removeUnits,
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
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
    const applications = {
      size: sinon.stub().returns(0)
    };
    const createMachine = sinon.stub();
    const destroyMachines = sinon.stub();
    const placeUnit = sinon.stub();
    const removeUnits = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: createMachine,
          destroyMachines: destroyMachines,
          placeUnit: placeUnit,
          removeUnits: removeUnits,
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
    const instance = renderer.getMountedInstance();
    instance._dropUnit('wordpress/8', 'new0');
    assert.equal(placeUnit.callCount, 1);
    assert.equal(placeUnit.args[0][0], 'wordpress/8');
    assert.equal(placeUnit.args[0][1], 'new0');
  });

  it('can disable menu actions when read only', function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => true}));
    const machines = {
      filterByParent: sinon.stub().returns([]),
      getById: sinon.stub(),
      revive: sinon.stub()
    };
    const units = {
      filterByMachine: sinon.stub().returns([])
    };
    const applications = {
      size: sinon.stub().returns(0)
    };
    const placeUnit = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineView.DecoratedComponent
        acl={acl}
        changeState={sinon.stub()}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: sinon.stub(),
          applications: applications,
          machines: machines,
          modelName: 'My Model',
          units: units
        })}
        generateMachineDetails={generateMachineDetails}
        machine="new0"
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: sinon.stub(),
          createMachine: sinon.stub(),
          destroyMachines: sinon.stub(),
          placeUnit: placeUnit,
          removeUnits: sinon.stub(),
          updateMachineConstraints: sinon.stub(),
          updateMachineSeries: sinon.stub()
        })}
        parseConstraints={parseConstraints}
        parseMachineName={parseMachineName}
        sendAnalytics={sendAnalytics} />, true);
    const output = renderer.getRenderOutput();
    const machineMenuItems = output.props.children.props.children[1]
      .props.menuItems;
    const containerMenuItems = output.props.children.props.children[2]
      .props.menuItems;
    assert.isFalse(machineMenuItems[0].action);
    assert.isFalse(containerMenuItems[0].action);
  });
});

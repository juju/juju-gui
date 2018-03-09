/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const shapeup = require('shapeup');

const ButtonRow = require('../../button-row/button-row');
const Constraints = require('../../constraints/constraints');
const MachineViewMachine = require('./machine');
const ButtonDropdown = require('../../button-dropdown/button-dropdown');
const MachineViewMachineUnit = require('../machine-unit/machine-unit');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewMachine', function() {
  let acl, applications, generateMachineDetails, genericConstraints,
      machineUnitACL, parseConstraints, sendAnalytics;

  beforeEach(function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => false}));
    sendAnalytics = sinon.stub();
    machineUnitACL = acl.reshape(
      MachineViewMachineUnit.DecoratedComponent.propTypes.acl);
    generateMachineDetails = sinon.stub().returns('2 units, zesty, mem: 2GB');
    parseConstraints = sinon.stub().returns({mem: '2048'});
    genericConstraints = [
      'cpu-power', 'cores', 'cpu-cores', 'mem', 'arch', 'tags', 'root-disk'];
    applications = {
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
    const removeUnit = sinon.stub();
    const selectMachine = sinon.stub();
    const machine = {
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096
      },
      series: 'wily'
    };
    const units = {
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
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: units
        }}
        dropUnit={sinon.stub()}
        isOver={false}
        machineAPI={{
          generateMachineDetails: generateMachineDetails,
          machine: machine,
          removeUnit: removeUnit,
          selectMachine: selectMachine,
          selected: false
        }}
        modelAPI={{
          destroyMachines: sinon.stub()
        }}
        parseConstraints={parseConstraints}
        sendAnalytics={sendAnalytics}
        showConstraints={true}
        type="machine" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="machine-view__machine machine-view__machine--machine"
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        <ButtonDropdown
          classes={['machine-view__machine-dropdown']}
          listItems={[{
            label: 'Destroy',
            action: instance._destroyMachine
          }]} />
        <div className="machine-view__machine-name">
          new0
        </div>
        <div className="machine-view__machine-hardware">
          2 units, zesty, mem: 2GB
        </div>
        <ul className="machine-view__machine-units">
          <MachineViewMachineUnit
            acl={machineUnitACL}
            key="wordpress/0"
            machineType="machine"
            removeUnit={removeUnit}
            sendAnalytics={sendAnalytics}
            service={applications.getById()}
            unit={{
              'agent_state': 'started',
              'displayName': 'wordpress/0',
              'id': 'wordpress/0'}} />
          <MachineViewMachineUnit
            acl={machineUnitACL}
            key="wordpress/1"
            machineType="machine"
            removeUnit={removeUnit}
            sendAnalytics={sendAnalytics}
            service={applications.getById()}
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
    expect(output).toEqualJSX(expected);
  });

  it('can render a machine in drop mode', function() {
    const selectMachine = sinon.stub();
    const machine = {
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096
      }
    };
    const units = {
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
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={true}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: units
        }}
        dropUnit={sinon.stub()}
        isOver={true}
        machineAPI={{
          generateMachineDetails: generateMachineDetails,
          machine: machine,
          selectMachine: selectMachine,
          selected: false
        }}
        modelAPI={{
          destroyMachines: sinon.stub()
        }}
        parseConstraints={parseConstraints}
        sendAnalytics={sendAnalytics}
        showConstraints={true}
        type="machine" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className={'machine-view__machine machine-view__machine--drop ' +
        'machine-view__machine--machine'}
      onClick={instance._handleSelectMachine}
      role="button"
      tabIndex="0">
        {output.props.children}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display a machine as uncommitted', function() {
    const selectMachine = sinon.stub();
    const machine = {
      displayName: 'new0',
      hardware: {},
      commitStatus: 'uncommitted'
    };
    const units = {filterByMachine: sinon.stub().returns([])};
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: units
        }}
        dropUnit={sinon.stub()}
        isOver={false}
        machineAPI={{
          machine: machine,
          selectMachine: selectMachine,
          selected: false
        }}
        modelAPI={{
          destroyMachines: sinon.stub()
        }}
        parseConstraints={sinon.stub()}
        sendAnalytics={sendAnalytics}
        type="machine" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className={'machine-view__machine ' +
        'machine-view__machine--uncommitted machine-view__machine--machine'}
      onClick={instance._handleSelectMachine}
      role="button"
      tabIndex="0">
        {output.props.children}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display a deleted machine as uncommitted', function() {
    const selectMachine = sinon.stub();
    const machine = {
      displayName: 'new0',
      hardware: {},
      deleted: true
    };
    const units = {filterByMachine: sinon.stub().returns([])};
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: units
        }}
        dropUnit={sinon.stub()}
        isOver={false}
        machineAPI={{
          machine: machine,
          selectMachine: selectMachine,
          selected: false
        }}
        modelAPI={{
          destroyMachines: sinon.stub()
        }}
        parseConstraints={sinon.stub()}
        sendAnalytics={sendAnalytics}
        type="machine" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className={'machine-view__machine ' +
        'machine-view__machine--uncommitted machine-view__machine--machine'}
      onClick={instance._handleSelectMachine}
      role="button"
      tabIndex="0">
        {output.props.children}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can hide units', function() {
    const removeUnit = sinon.stub();
    const selectMachine = sinon.stub();
    const machine = {
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096
      }
    };
    const units = {
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
    const wordpress = {
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
    applications.getById = function(val) {
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
    const output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: units
        }}
        dropUnit={sinon.stub()}
        isOver={false}
        machineAPI={{
          machine: machine,
          removeUnit: removeUnit,
          selectMachine: selectMachine,
          selected: false
        }}
        modelAPI={{
          destroyMachines: sinon.stub()
        }}
        parseConstraints={sinon.stub()}
        sendAnalytics={sendAnalytics}
        type="machine" />);
    const expected = (
      <ul className="machine-view__machine-units">
        {[
          <MachineViewMachineUnit
            acl={machineUnitACL}
            key="wordpress/1"
            machineType="machine"
            removeUnit={removeUnit}
            sendAnalytics={sendAnalytics}
            service={wordpress}
            unit={{
              'deleted': false,
              'displayName': 'wordpress/1',
              'id': 'wordpress/1',
              'service': 'wordpress'}} />
        ]}
      </ul>);
    expect(output.props.children[3]).toEqualJSX(expected);
  });

  it('can hide the constraints', function() {
    const removeUnit = sinon.stub();
    const selectMachine = sinon.stub();
    const machine = {
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096
      }
    };
    const units = {
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
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: units
        }}
        dropUnit={sinon.stub()}
        isOver={false}
        machineAPI={{
          machine: machine,
          removeUnit: removeUnit,
          selectMachine: selectMachine,
          selected: false
        }}
        modelAPI={{
          destroyMachines: sinon.stub()
        }}
        parseConstraints={sinon.stub()}
        sendAnalytics={sendAnalytics}
        showConstraints={false}
        type="machine" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="machine-view__machine machine-view__machine--machine"
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        <ButtonDropdown
          classes={['machine-view__machine-dropdown']}
          listItems={[{
            label: 'Destroy',
            action: instance._destroyMachine
          }]} />
        <div className="machine-view__machine-name">
          new0
        </div>
        {undefined}
        <ul className="machine-view__machine-units">
          <MachineViewMachineUnit
            acl={machineUnitACL}
            key="wordpress/0"
            machineType="machine"
            removeUnit={removeUnit}
            sendAnalytics={sendAnalytics}
            service={applications.getById()}
            unit={{
              'agent_state': 'started',
              'displayName': 'wordpress/0',
              'id': 'wordpress/0'}} />
          <MachineViewMachineUnit
            acl={machineUnitACL}
            key="wordpress/1"
            machineType="machine"
            removeUnit={removeUnit}
            sendAnalytics={sendAnalytics}
            service={applications.getById()}
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
    expect(output).toEqualJSX(expected);
  });

  it('can render a container', function() {
    const machine = {
      displayName: 'new0/lxc/0'
    };
    const units = {
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
    const removeUnit = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: units
        }}
        dropUnit={sinon.stub()}
        isOver={false}
        machineAPI={{
          machine: machine,
          removeUnit: removeUnit
        }}
        modelAPI={{
          destroyMachines: sinon.stub()
        }}
        parseConstraints={sinon.stub()}
        sendAnalytics={sendAnalytics}
        showConstraints={true}
        type="container" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="machine-view__machine machine-view__machine--container"
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        <ButtonDropdown
          classes={['machine-view__machine-dropdown']}
          listItems={[{
            label: 'Destroy',
            action: instance._destroyMachine
          }]} />
        <div className="machine-view__machine-name">
          new0/lxc/0
        </div>
        {undefined}
        <ul className="machine-view__machine-units">
          <MachineViewMachineUnit
            acl={machineUnitACL}
            key="wordpress/0"
            machineType="container"
            removeUnit={removeUnit}
            sendAnalytics={sendAnalytics}
            service={applications.getById()}
            unit={{
              'agent_state': 'started',
              'displayName': 'wordpress/0',
              'id': 'wordpress/0'}} />
          <MachineViewMachineUnit
            acl={machineUnitACL}
            key="wordpress/1"
            machineType="container"
            removeUnit={removeUnit}
            sendAnalytics={sendAnalytics}
            service={applications.getById()}
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
    expect(output).toEqualJSX(expected);
  });

  it('can destroy a machine', function() {
    const destroyMachines = sinon.stub();
    const selectMachine = sinon.stub();
    const machine = {
      displayName: 'new0',
      id: 'new0'
    };
    const units = {
      filterByMachine: sinon.stub().returns([{
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    const output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: units
        }}
        dropUnit={sinon.stub()}
        genericConstraints={genericConstraints}
        isOver={false}
        machineAPI={{
          generateMachineDetails: generateMachineDetails,
          machine: machine,
          selectMachine: selectMachine,
          selected: false
        }}
        modelAPI={{
          destroyMachines: destroyMachines
        }}
        parseConstraints={parseConstraints}
        sendAnalytics={sendAnalytics}
        showConstraints={true}
        type="machine" />);
    output.props.children[0].props.listItems[0].action();
    assert.equal(destroyMachines.callCount, 1);
    assert.deepEqual(destroyMachines.args[0][0], ['new0']);
  });

  it('can remove a unit', function() {
    const machine = {
      displayName: 'new0/lxc/0'
    };
    const units = {
      filterByMachine: sinon.stub().returns([{
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    const removeUnit = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: units
        }}
        dropUnit={sinon.stub()}
        isOver={false}
        machineAPI={{
          machine: machine,
          removeUnit: removeUnit
        }}
        modelAPI={{
          destroyMachines: sinon.stub()
        }}
        parseConstraints={sinon.stub()}
        sendAnalytics={sendAnalytics}
        showConstraints={true}
        type="container" />, true);
    const output = renderer.getRenderOutput();
    output.props.children[3].props.children[0].props.removeUnit();
    assert.equal(removeUnit.callCount, 1);
  });

  it('can disable the destroy when ready only', function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => true}));
    const removeUnit = sinon.stub();
    const selectMachine = sinon.stub();
    const machine = {
      commitStatus: 'uncommitted',
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096
      },
      series: 'wily'
    };
    const units = {
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
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: units
        }}
        dropUnit={sinon.stub()}
        isOver={false}
        machineAPI={{
          generateMachineDetails: generateMachineDetails,
          machine: machine,
          removeUnit: removeUnit,
          selectMachine: selectMachine,
          selected: false
        }}
        modelAPI={{
          destroyMachines: sinon.stub()
        }}
        parseConstraints={parseConstraints}
        sendAnalytics={sendAnalytics}
        showConstraints={true}
        type="machine" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <ButtonDropdown
        classes={['machine-view__machine-dropdown']}
        listItems={[{
          label: 'Destroy',
          action: null
        }, {
          label: 'Update constraints',
          action: null
        }]} />);
    expect(output.props.children[0]).toEqualJSX(expected);
  });

  it('can display a form to update constraints', function() {
    const machine = {
      commitStatus: 'uncommitted',
      constraints: 'cpu-power=10 cores=2 mem=1024 root-disk=2048',
      id: 'new0',
      series: 'wily'
    };
    const renderer = jsTestUtils.shallowRender(
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: {filterByMachine: sinon.stub().returns([])}
        }}
        dropUnit={sinon.stub()}
        genericConstraints={genericConstraints}
        isOver={false}
        machineAPI={{
          generateMachineDetails: generateMachineDetails,
          machine: machine,
          removeUnit: sinon.stub(),
          series: ['wily'],
          selectMachine: sinon.stub(),
          selected: false
        }}
        modelAPI={{
          destroyMachines: sinon.stub(),
          providerType: 'aws'
        }}
        parseConstraints={parseConstraints}
        sendAnalytics={sendAnalytics}
        showConstraints={true}
        type="machine" />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    output.props.children[0].props.listItems[1].action();
    output = renderer.getRenderOutput();
    const expected = (
      <div className="add-machine__constraints">
        <h4 className="add-machine__title">
          Update constraints
        </h4>
        <Constraints
          constraints={{mem: '2048'}}
          currentSeries={machine.series}
          disabled={false}
          hasUnit={false}
          providerType="aws"
          series={['wily']}
          valuesChanged={instance._updateConstraints} />
        <ButtonRow
          buttons={[{
            title: 'Cancel',
            action: instance._toggleForm,
            type: 'base'
          }, {
            title: 'Update',
            action: instance._setConstraints,
            type: 'neutral',
            disabled: false
          }]}
          key="buttons" />
      </div>);
    expect(output.props.children[4]).toEqualJSX(expected);
  });

  it('can update constraints', function() {
    const machine = {
      commitStatus: 'uncommitted',
      constraints: 'cpu-power=10 cores=2 mem=1024 root-disk=2048',
      id: 'new0',
      series: 'wily'
    };
    const updateMachineConstraints = sinon.stub();
    const updateMachineSeries = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <MachineViewMachine.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        dbAPI={{
          applications: applications,
          units: {filterByMachine: sinon.stub().returns([])}
        }}
        dropUnit={sinon.stub()}
        genericConstraints={genericConstraints}
        isOver={false}
        machineAPI={{
          generateMachineDetails: generateMachineDetails,
          machine: machine,
          removeUnit: sinon.stub(),
          series: ['wily'],
          selectMachine: sinon.stub(),
          selected: false
        }}
        modelAPI={{
          destroyMachines: sinon.stub(),
          providerType: 'aws',
          updateMachineConstraints: updateMachineConstraints,
          updateMachineSeries: updateMachineSeries
        }}
        parseConstraints={parseConstraints}
        sendAnalytics={sendAnalytics}
        showConstraints={true}
        type="machine" />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    output.props.children[0].props.listItems[1].action();
    output = renderer.getRenderOutput();
    instance._updateConstraints({
      arch: 'i386',
      series: 'zesty'
    });
    output.props.children[4].props.children[2].props.buttons[1].action();
    assert.equal(updateMachineConstraints.callCount, 1);
    assert.equal(updateMachineConstraints.args[0][0], 'new0');
    assert.deepEqual(updateMachineConstraints.args[0][1], {
      arch: 'i386'
    });
    assert.equal(updateMachineSeries.callCount, 1);
    assert.equal(updateMachineSeries.args[0][0], 'new0');
    assert.equal(updateMachineSeries.args[0][1], 'zesty');
  });
});

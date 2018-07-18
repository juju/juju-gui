/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const shapeup = require('shapeup');

const ButtonRow = require('../../button-row/button-row');
const Constraints = require('../../constraints/constraints');
const Machine = require('../../shared/machine/machine');
const MachineViewMachine = require('./machine');
const MachineViewMachineUnit = require('../machine-unit/machine-unit');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewMachine', function() {
  let acl, applications, dbAPI, parseMachineDetails, genericConstraints,
      machineAPI, machineUnitACL, modelAPI, parseConstraints;

  const renderComponent = (options = {}) => enzyme.shallow(
    // The component is wrapped to handle drag and drop, but we just want to
    // test the internal component so we access it via DecoratedComponent.
    <MachineViewMachine.DecoratedComponent
      acl={acl}
      canDrop={options.canDrop === undefined ? false : options.canDrop}
      changeState={
        options.changeState === undefined ? null : options.changeState}
      connectDropTarget={jsTestUtils.connectDropTarget}
      dbAPI={options.dbAPI || dbAPI}
      dropUnit={options.dropUnit || sinon.stub()}
      genericConstraints={options.genericConstraints}
      isOver={options.isOver === undefined ? false : options.isOver}
      machineAPI={options.machineAPI || machineAPI}
      modelAPI={options.modelAPI || modelAPI}
      parseConstraints={options.parseConstraints || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      showConstraints={
        options.showConstraints === undefined ? true : options.showConstraints}
      showSSHButton={
        options.showSSHButton === undefined ? false : options.showSSHButton}
      type={options.type || 'machine'} />
  );

  beforeEach(function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => false}));
    machineUnitACL = acl.reshape(
      MachineViewMachineUnit.DecoratedComponent.propTypes.acl);
    parseMachineDetails = sinon.stub().returns([{
      label: 'mem',
      value: '1.00GB'
    }]);
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
    const machine = {
      displayName: 'new0',
      id: 'new0',
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
    dbAPI = {
      applications: applications,
      units: units
    };
    machineAPI = {
      parseMachineDetails: parseMachineDetails,
      machine: machine,
      removeUnit: sinon.stub(),
      selectMachine: sinon.stub(),
      selected: false,
      series: ['wily']
    };
    modelAPI = {
      destroyMachines: sinon.stub(),
      providerType: 'aws',
      updateMachineConstraints: sinon.stub(),
      updateMachineSeries: sinon.stub()
    };
  });

  it('can render a machine', function() {
    const wrapper = renderComponent();
    const expected = (
      <div>
        <Machine
          classes={['machine-view__machine', 'machine-view__machine--machine']}
          hardware={[{
            label: 'mem',
            value: '1.00GB'
          }]}
          isContainer={false}
          machine={{
            name: 'new0',
            root: false,
            region: null,
            series: 'wily',
            status: null
          }}
          menuItems={null}
          onClick={wrapper.find('Machine').prop('onClick')}
          sshAction={undefined}
          sshLabel={undefined}>
          <ul className="machine-view__machine-units machine__units">
            <MachineViewMachineUnit
              acl={machineUnitACL}
              icon="icon.svg"
              key="wordpress/0"
              machineType="machine"
              removeUnit={sinon.stub()}
              sendAnalytics={sinon.stub()}
              unit={{
                'agent_state': 'started',
                'displayName': 'wordpress/0',
                'id': 'wordpress/0'}} />
            <MachineViewMachineUnit
              acl={machineUnitACL}
              icon="icon.svg"
              key="wordpress/1"
              machineType="machine"
              removeUnit={sinon.stub()}
              sendAnalytics={sinon.stub()}
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
        </Machine>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render a machine in drop mode', function() {
    const wrapper = renderComponent({
      canDrop: true,
      isOver: true
    });
    assert.equal(
      wrapper.find('Machine').prop('classes').includes('machine-view__machine--drop'),
      true);
  });

  it('can display a machine as uncommitted', function() {
    machineAPI.machine.commitStatus = 'uncommitted';
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('Machine').prop('classes').includes('machine-view__machine--uncommitted'),
      true);
  });

  it('can display a deleted machine as uncommitted', function() {
    machineAPI.machine.deleted = true;
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('Machine').prop('classes').includes('machine-view__machine--uncommitted'),
      true);
  });

  it('can pass ssh action props', function() {
    machineAPI.machine.public_address = '1.1.1.1';
    const wrapper = renderComponent({
      showSSHButton: true
    });
    const machine = wrapper.find('Machine');
    assert.isFunction(machine.prop('sshAction'));
    assert.equal(machine.prop('sshLabel'), '1.1.1.1');
  });

  it('can hide units', function() {
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
    dbAPI.applications = applications;
    dbAPI.units = units;
    const wrapper = renderComponent();
    const expected = (
      <ul className="machine-view__machine-units machine__units">
        {[
          <MachineViewMachineUnit
            acl={machineUnitACL}
            icon="icon.svg"
            key="wordpress/1"
            machineType="machine"
            removeUnit={sinon.stub()}
            sendAnalytics={sinon.stub()}
            unit={{
              'deleted': false,
              'displayName': 'wordpress/1',
              'id': 'wordpress/1',
              'service': 'wordpress'}} />
        ]}
      </ul>);
    assert.compareJSX(wrapper.find('.machine-view__machine-units'), expected);
  });

  it('can hide the constraints', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.add-machine__constraints').length, 0);
  });

  it('can render a container', function() {
    const machine = {
      displayName: 'new0/lxc/0'
    };
    machineAPI.machine = machine;
    const wrapper = renderComponent({ type: 'container' });
    assert.equal(wrapper.find('.add-machine__constraints').length, 0);
    const expected = (
      <ul className="machine-view__machine-units machine__units">
        <MachineViewMachineUnit
          acl={machineUnitACL}
          icon="icon.svg"
          key="wordpress/0"
          machineType="container"
          removeUnit={sinon.stub()}
          sendAnalytics={sinon.stub()}
          unit={{
            'agent_state': 'started',
            'displayName': 'wordpress/0',
            'id': 'wordpress/0'}} />
        <MachineViewMachineUnit
          acl={machineUnitACL}
          icon="icon.svg"
          key="wordpress/1"
          machineType="container"
          removeUnit={sinon.stub()}
          sendAnalytics={sinon.stub()}
          unit={{
            'agent_state': 'started',
            'displayName': 'wordpress/1',
            'id': 'wordpress/1'}} />
      </ul>);
    assert.compareJSX(wrapper.find('.machine-view__machine-units'), expected);
  });

  it('can destroy a machine', function() {
    const wrapper = renderComponent();
    wrapper.find('Machine').prop('menuItems')[0].action();
    const destroyMachines = modelAPI.destroyMachines;
    assert.equal(destroyMachines.callCount, 1);
    assert.deepEqual(destroyMachines.args[0][0], ['new0']);
  });

  it('can remove a unit', function() {
    const machine = {
      displayName: 'new0/lxc/0'
    };
    machineAPI.machine = machine;
    const wrapper = renderComponent({ type: 'container' });
    wrapper.find('DragSource(MachineViewMachineUnit)').at(0).props().removeUnit();
    assert.equal(machineAPI.removeUnit.callCount, 1);
  });

  it('can disable the destroy when ready only', function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => true}));
    const wrapper = renderComponent();
    assert.strictEqual(
      wrapper.find('Machine').prop('menuItems')[0].action, null);
  });

  it('can display a form to update constraints', function() {
    const machine = {
      commitStatus: 'uncommitted',
      constraints: 'cpu-power=10 cores=2 mem=1024 root-disk=2048',
      displayName: 'new0',
      id: 'new0',
      series: 'wily'
    };
    machineAPI.machine = machine;
    const wrapper = renderComponent({
      genericConstraints,
      parseConstraints,
      showConstraints: true
    });
    wrapper.find('Machine').prop('menuItems')[1].action();
    wrapper.update();
    const buttons = wrapper.find('ButtonRow').prop('buttons');
    const expected = (
      <div className="add-machine__constraints">
        <h4 className="add-machine__title">
          Update constraints
        </h4>
        <Constraints
          constraints={{mem: '2048'}}
          currentSeries={machine.series}
          disabled={false}
          hasUnit={true}
          providerType="aws"
          series={['wily']}
          valuesChanged={wrapper.find('Constraints').prop('valuesChanged')} />
        <ButtonRow
          buttons={[{
            title: 'Cancel',
            action: buttons[0].action,
            type: 'base'
          }, {
            title: 'Update',
            action: buttons[1].action,
            type: 'neutral',
            disabled: false
          }]}
          key="buttons" />
      </div>);
    assert.compareJSX(wrapper.find('.add-machine__constraints'), expected);
  });

  it('can update constraints', function() {
    const machine = {
      commitStatus: 'uncommitted',
      constraints: 'cpu-power=10 cores=2 mem=1024 root-disk=2048',
      displayName: 'new0',
      id: 'new0',
      series: 'wily'
    };
    machineAPI.machine = machine;
    const wrapper = renderComponent({
      genericConstraints,
      parseConstraints,
      showConstraints: true
    });
    wrapper.find('Machine').prop('menuItems')[1].action();
    wrapper.update();
    const instance = wrapper.instance();
    instance._updateConstraints({
      arch: 'i386',
      series: 'zesty'
    });
    wrapper.find('ButtonRow').prop('buttons')[1].action();
    const updateMachineConstraints = modelAPI.updateMachineConstraints;
    const updateMachineSeries = modelAPI.updateMachineSeries;
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

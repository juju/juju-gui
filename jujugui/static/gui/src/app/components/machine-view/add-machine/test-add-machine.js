/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const shapeup = require('shapeup');

const MachineViewAddMachine = require('./add-machine');
const ButtonRow = require('../../shared/button-row/button-row');
const Constraints = require('../../constraints/constraints');

describe('MachineViewAddMachine', function() {
  let acl, dbAPI, modelAPI, unit;

  const renderComponent = (options = {}) => enzyme.shallow(
    <MachineViewAddMachine
      acl={options.acl || acl}
      close={options.close || sinon.stub()}
      dbAPI={options.dbAPI}
      modelAPI={options.modelAPI || modelAPI}
      parentId={options.parentId}
      selectMachine={options.selectMachine}
      series={options.series}
      unit={options.unit} />
  );

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
    modelAPI = {
      createMachine: sinon.stub().returns({id: 'new0'}),
      placeUnit: sinon.stub(),
      providerType: 'ec2'
    };
    dbAPI = {
      machines: {
        filterByParent: sinon.stub().returns([{
          id: 'new0',
          displayName: 'new0'
        }, {
          id: 'new1',
          displayName: 'new1'
        }, {
          // Deleted machines should not appear in the list of options.
          id: 'new2',
          deleted: true,
          displayName: 'new2'
        }])
      }
    };
    unit = {id: 'unit1'};
  });

  it('can render for creating a machine', function() {
    const wrapper = renderComponent();
    const buttons = [{
      title: 'Cancel',
      type: 'base',
      action: sinon.stub()
    }, {
      title: 'Create',
      action: wrapper.find('ButtonRow').prop('buttons')[1].action,
      type: 'neutral',
      disabled: undefined
    }];
    const expected = (
      <div className="add-machine">
        <div className="add-machine__constraints" key="constraints">
          <h4 className="add-machine__title">
            Define constraints
          </h4>
          <Constraints
            containerType={''}
            disabled={false}
            hasUnit={false}
            providerType={'ec2'}
            series={undefined}
            valuesChanged={wrapper.find('Constraints').prop('valuesChanged')} />
        </div>
        <ButtonRow
          buttons={buttons}
          key="buttons" />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can disable the controls when read only', function() {
    acl = shapeup.deepFreeze({isReadOnly: () => true});
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('ButtonRow').prop('buttons')[1].disabled, true);
  });

  it('can render for creating a container', function() {
    const wrapper = renderComponent({ parentId: 'new0' });
    const expected = (
      <div className="add-machine">{[
        <select
          className="add-machine__container"
          defaultValue=""
          disabled={false}
          key="containers"
          onChange={wrapper.find('select').prop('onChange')}>
          <option disabled={true} value="">
            Choose container type...
          </option>
          {undefined}
          <option value="lxd">LXD</option>
          <option value="kvm">KVM</option>
        </select>
      ]}</div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render for selecting a machine', function() {
    const wrapper = renderComponent({
      dbAPI,
      parentId: 'new0',
      unit
    });
    const expected = (
      <select
        defaultValue=""
        disabled={false}
        key="machines"
        onChange={wrapper.find('select').prop('onChange')}>
        <option disabled={true} value="">
          Move to...
        </option>
        <option value="new">
          New machine
        </option>
        {[
          <option
            key="new0"
            value="new0">
            new0
          </option>,
          <option
            key="new1"
            value="new1">
            new1
          </option>
        ]}
      </select>);
    assert.compareJSX(wrapper.find('select'), expected);
  });

  it('can call the cancel method', function() {
    const close = sinon.stub();
    const wrapper = renderComponent({ close });
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(close.callCount, 1);
  });

  it('can create a machine', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    wrapper.find('ButtonRow').prop('buttons')[1].action();
    const createMachine = modelAPI.createMachine;
    assert.equal(createMachine.callCount, 1);
    assert.equal(createMachine.args[0][0], null);
    assert.equal(createMachine.args[0][1], null);
    assert.equal(createMachine.args[0][2], instance.state.constraints);
  });

  it('can create a container', function() {
    const wrapper = renderComponent({ parentId: 'new0' });
    wrapper.find('.add-machine__container').simulate('change', {
      currentTarget: {
        value: 'lxd'
      }
    });
    wrapper.find('ButtonRow').prop('buttons')[1].action();
    const createMachine = modelAPI.createMachine;
    assert.equal(createMachine.callCount, 1);
    assert.equal(createMachine.args[0][0], 'lxd');
    assert.equal(createMachine.args[0][1], 'new0');
  });

  it('can place a unit on a new machine', function() {
    const wrapper = renderComponent({
      dbAPI,
      parentId: 'new0',
      unit
    });
    const instance = wrapper.instance();
    instance.setState({selectedMachine: 'new'});
    instance._submitForm();
    const createMachine = modelAPI.createMachine;
    const placeUnit = modelAPI.placeUnit;
    assert.equal(createMachine.callCount, 1);
    assert.equal(createMachine.args[0][0], null);
    assert.equal(createMachine.args[0][1], null);
    assert.equal(createMachine.args[0][2], instance.state.constraints);
    assert.equal(placeUnit.callCount, 1);
    assert.deepEqual(placeUnit.args[0][0], {id: 'unit1'});
    assert.equal(placeUnit.args[0][1], 'new0');
  });

  it('can place a unit on a new container', function() {
    modelAPI.createMachine.returns({id: 'new0/lxc/new1'});
    const wrapper = renderComponent({
      dbAPI,
      parentId: 'new0',
      unit
    });
    const instance = wrapper.instance();
    instance.setState({
      selectedContainer: 'lxc'
    });
    instance._submitForm();
    const createMachine = modelAPI.createMachine;
    const placeUnit = modelAPI.placeUnit;
    assert.equal(createMachine.callCount, 1);
    assert.equal(createMachine.args[0][0], 'lxc');
    assert.equal(createMachine.args[0][1], 'new0');
    assert.equal(createMachine.args[0][2], instance.state.constraints);
    assert.equal(placeUnit.callCount, 1);
    assert.deepEqual(placeUnit.args[0][0], {id: 'unit1'});
    assert.equal(placeUnit.args[0][1], 'new0/lxc/new1');
  });

  it('can place a unit on an existing machine', function() {
    const wrapper = renderComponent({
      dbAPI,
      parentId: 'new0',
      unit
    });
    const instance = wrapper.instance();
    instance.setState({
      selectedMachine: 'new0',
      selectedContainer: 'new0'
    });
    instance._submitForm();
    const createMachine = modelAPI.createMachine;
    const placeUnit = modelAPI.placeUnit;
    assert.equal(createMachine.callCount, 0);
    assert.equal(placeUnit.callCount, 1);
    assert.deepEqual(placeUnit.args[0][0], {id: 'unit1'});
    assert.equal(placeUnit.args[0][1], 'new0');
  });

  it('can place a unit on an existing container', function() {
    const wrapper = renderComponent({
      dbAPI,
      parentId: 'new0',
      unit
    });
    const instance = wrapper.instance();
    instance.setState({
      selectedMachine: 'new0',
      selectedContainer: 'new0/lxc/new0'
    });
    instance._submitForm();
    const createMachine = modelAPI.createMachine;
    const placeUnit = modelAPI.placeUnit;
    assert.equal(createMachine.callCount, 0);
    assert.equal(placeUnit.callCount, 1);
    assert.deepEqual(placeUnit.args[0][0], {id: 'unit1'});
    assert.equal(placeUnit.args[0][1], 'new0/lxc/new0');
  });

  it('can select a machine when created', function() {
    const selectMachine = sinon.stub();
    const wrapper = renderComponent({
      dbAPI,
      parentId: 'new0',
      selectMachine,
      unit
    });
    const instance = wrapper.instance();
    instance.setState({selectedMachine: 'new'});
    instance._submitForm();
    assert.equal(selectMachine.callCount, 1);
    assert.equal(selectMachine.args[0][0], 'new0');
  });

  it('does not select a container when created', function() {
    modelAPI.createMachine = sinon.stub().returns({id: 'new0/lxc/new1'});
    const selectMachine = sinon.stub();
    const wrapper = renderComponent({
      dbAPI,
      parentId: 'new0',
      selectMachine,
      unit
    });
    const instance = wrapper.instance();
    instance.setState({
      selectedContainer: 'lxc'
    });
    instance._submitForm();
    assert.equal(selectMachine.callCount, 0);
  });
});

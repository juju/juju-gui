/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const shapeup = require('shapeup');

const ButtonRow = require('../../button-row/button-row');
const Constraints = require('../../constraints/constraints');

class MachineViewAddMachine extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      constraints: null,
      selectedContainer: null,
      selectedMachine:
        !this.props.dbAPI && !this.props.parentId ? 'new' : null
    };
  }

  /**
    Update the state with the new constraints values.

    @method _updateConstraints
    @param {Object} constraints The new constraints values.
  */
  _updateConstraints(constraints) {
    this.setState({constraints: constraints});
  }

  /**
    Create the machine.

    @method _submitForm
  */
  _submitForm() {
    const props = this.props;
    const state = this.state;
    const machineId = this._getParentId();
    const selectedContainer = state.selectedContainer;
    if (machineId && machineId !== 'new' && !selectedContainer) {
      // Don't try and create a container if the container type has not been
      // selected.
      return;
    }
    const selectedMachine = state.selectedMachine;
    let machine = {};
    // If the state is set for a new machine or container then actually add
    // the machine/container.
    if (
      selectedMachine === 'new' ||
      selectedContainer === 'lxc' ||
      selectedContainer === 'lxd' ||
      selectedContainer === 'kvm'
    ) {
      const constraints = state.constraints || {};
      const series = constraints.series || null;
      delete constraints.series;
      machine = props.modelAPI.createMachine(
        selectedContainer, machineId, series, constraints);
      if (props.selectMachine && !machineId) {
        props.selectMachine(machine.id);
      }
    }
    // If the component has been provided a unit then we need to place the
    // unit on the machine/container.
    if (props.unit) {
      props.modelAPI.placeUnit(
        props.unit, machine.id || selectedContainer || selectedMachine);
    }
    this.props.close();
  }

  /**
    Get the parent id or selected machine.

    @method _getParentId
  */
  _getParentId() {
    var selectedMachine = this.state.selectedMachine;
    if (selectedMachine === 'new') {
      return null;
    }
    return this.props.parentId || selectedMachine;
  }

  /**
    Generate the constraints form.

    @method _generateConstraints
  */
  _generateConstraints() {
    const props = this.props;
    return (
      <div className="add-machine__constraints" key='constraints'>
        <h4 className="add-machine__title">
          Define constraints
        </h4>
        <Constraints
          containerType={this.state.selectedContainer || ''}
          disabled={props.acl.isReadOnly()}
          hasUnit={!!props.unit}
          providerType={props.modelAPI.providerType}
          series={props.series}
          valuesChanged={this._updateConstraints.bind(this)}
        />
      </div>);
  }

  /**
    Update the state with the selected container type.

    @method _updateSelectedContainer
    @param {Object} e The change event.
  */
  _updateSelectedContainer(e) {
    this.setState({selectedContainer: e.currentTarget.value});
  }

  /**
    Generate the container type form.

    @method _generateSelectContainer
  */
  _generateSelectContainer() {
    return (
      <select className="add-machine__container"
        defaultValue=""
        disabled={this.props.acl.isReadOnly()}
        key="containers"
        onChange={this._updateSelectedContainer.bind(this)}>
        <option disabled={true} value="">
          Choose container type...
        </option>
        {this._generateContainerOptions()}
        <option value="lxd">LXD</option>
        <option value="kvm">KVM</option>
      </select>);
  }

  /**
    Update the state with the selected machine.

    @method _updateSelectedMachine
    @param {Object} e The change event.
  */
  _updateSelectedMachine(e) {
    this.setState({selectedMachine: e.currentTarget.value});
  }

  /**
    Generate machine selection.

    @method _generateSelectContainer
  */
  _generateSelectMachine() {
    return (
      <select
        defaultValue=""
        disabled={this.props.acl.isReadOnly()}
        key="machines"
        onChange={this._updateSelectedMachine.bind(this)}>
        <option disabled={true} value="">
          Move to...
        </option>
        <option value="new">
          New machine
        </option>
        {this._generateMachineOptions()}
      </select>);
  }

  /**
    Generate a list of machine options.

    @method _generateMachineOptions
    @return {Array} A list of machine options.
  */
  _generateMachineOptions() {
    const components = [];
    const machines = this.props.dbAPI.machines.filterByParent();
    machines.forEach((machine) => {
      if (machine.deleted) {
        return;
      }
      components.push(
        <option
          key={machine.id}
          value={machine.id}>
          {machine.displayName}
        </option>);
    });
    return components;
  }

  /**
    Generate a list of container options.

    @method _generateContainerOptions
    @return {Array} A list of container options.
  */
  _generateContainerOptions() {
    const dbAPI = this.props.dbAPI;
    if (!dbAPI) {
      return;
    }
    var components = [];
    var containers = dbAPI.machines.filterByParent(this.state.selectedMachine);
    var machineId = this._getParentId();
    components.push(
      <option
        key="root"
        value={machineId}>
        {machineId}/root-container
      </option>);
    containers.forEach((container) => {
      if (container.deleted) {
        return;
      }
      components.push(
        <option
          key={container.id}
          value={container.id}>
          {container.displayName}
        </option>);
    });
    return components;
  }

  /**
    Generate the buttons based on the state.

    @method _generateButtons
    @return {Object} The buttons.
  */
  _generateButtons() {
    const props = this.props;
    const buttons = [{
      title: 'Cancel',
      action: props.close,
      type: 'base'
    }, {
      title: props.unit ? 'Place' : 'Create',
      action: this._submitForm.bind(this),
      type: 'neutral',
      // In the add-container mode disable the Create button until a container
      // type has been selected.
      disabled: props.acl.isReadOnly() || (!props.unit && !props.dbAPI
        && props.parentId && !this.state.selectedContainer)
    }];
    return (
      <ButtonRow
        buttons={buttons}
        key="buttons" />);
  }

  render() {
    const components = [];
    const props = this.props;
    const state = this.state;
    if (props.unit && props.dbAPI) {
      components.push(this._generateSelectMachine());
      if (state.selectedMachine) {
        if (state.selectedMachine === 'new') {
          components.push(this._generateConstraints());
        } else {
          components.push(this._generateSelectContainer());
          const selectedContainer = state.selectedContainer;
          if (selectedContainer === 'lxd' || selectedContainer === 'kvm') {
            components.push(this._generateConstraints());
          }
        }
        components.push(this._generateButtons());
      }
    } else if (!props.dbAPI) {
      if (props.parentId) {
        components.push(this._generateSelectContainer());
        if (state.selectedContainer) {
          components.push(this._generateConstraints());
          components.push(this._generateButtons());
        }
      } else {
        components.push(this._generateConstraints());
        components.push(this._generateButtons());
      }
    }
    return <div className="add-machine">{components}</div>;
  }
};

MachineViewAddMachine.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  close: PropTypes.func.isRequired,
  dbAPI: shapeup.shape({
    machines: PropTypes.object.isRequired
  }),
  modelAPI: shapeup.shape({
    createMachine: PropTypes.func.isRequired,
    placeUnit: PropTypes.func,
    providerType: PropTypes.string
  }).isRequired,
  parentId: PropTypes.string,
  selectMachine: PropTypes.func,
  series: PropTypes.array,
  unit: PropTypes.object
};

module.exports = MachineViewAddMachine;

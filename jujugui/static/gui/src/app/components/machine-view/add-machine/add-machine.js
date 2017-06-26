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

class MachineViewAddMachine extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      constraints: null,
      selectedContainer: null,
      selectedMachine:
        !this.props.machines && !this.props.parentId ? 'new' : null
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
      machine = this.props.createMachine(
        selectedContainer, machineId, series, constraints);
      if (this.props.selectMachine && !machineId) {
        this.props.selectMachine(machine.id);
      }
    }
    // If the component has been provided a unit then we need to place the
    // unit on the machine/container.
    if (props.unit) {
      props.placeUnit(
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
        <juju.components.Constraints
          containerType={this.state.selectedContainer || ''}
          disabled={props.acl.isReadOnly()}
          hasUnit={!!props.unit}
          providerType={props.providerType}
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
    var components = [];
    var machines = this.props.machines.filterByParent();
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
    var machines = this.props.machines;
    if (!machines) {
      return;
    }
    var components = [];
    var containers = machines.filterByParent(this.state.selectedMachine);
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
      disabled: this.props.acl.isReadOnly() || (!props.unit && !props.machines
        && props.parentId && !this.state.selectedContainer)
    }];
    return (
      <juju.components.ButtonRow
        buttons={buttons}
        key="buttons" />);
  }

  render() {
    const components = [];
    const props = this.props;
    const state = this.state;
    if (props.unit && props.machines) {
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
    } else if (!props.machines) {
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
  acl: React.PropTypes.object.isRequired,
  close: React.PropTypes.func.isRequired,
  createMachine: React.PropTypes.func.isRequired,
  machines: React.PropTypes.object,
  parentId: React.PropTypes.string,
  placeUnit: React.PropTypes.func,
  providerType: React.PropTypes.string,
  selectMachine: React.PropTypes.func,
  series: React.PropTypes.array,
  unit: React.PropTypes.object
};

YUI.add('machine-view-add-machine', function() {
  juju.components.MachineViewAddMachine = MachineViewAddMachine;
}, '0.1.0', {
  requires: [
    'button-row',
    'constraints'
  ]
});

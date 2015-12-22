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

YUI.add('machine-view-add-machine', function() {

  juju.components.MachineViewAddMachine = React.createClass({
    propTypes: {
      close: React.PropTypes.func.isRequired,
      createMachine: React.PropTypes.func.isRequired,
      machines: React.PropTypes.object,
      parentId: React.PropTypes.string,
      placeUnit: React.PropTypes.func,
      unit: React.PropTypes.object
    },

    /**
      Generate the initial state for the component.

      @method getInitialState
      @returns {Object} The initial state.
    */
    getInitialState: function() {
      return {
        constraints: null,
        selectedContainer: null,
        selectedMachine:
          !this.props.machines && !this.props.parentId ? 'new' : null
      };
    },

    /**
      Update the state with the new constraints values.

      @method _updateConstraints
      @param {Object} constraints The new constraints values.
    */
    _updateConstraints: function(constraints) {
      this.setState({constraints: constraints});
    },

    /**
      Create the machine.

      @method _submitForm
    */
    _submitForm: function() {
      var props = this.props;
      var state = this.state;
      var machineId = this._getParentId();
      var selectedContainer = state.selectedContainer;
      var selectedMachine = state.selectedMachine;
      var constraints = state.constraints;
      var machine;
      if (machineId && machineId !== 'new' && !selectedContainer) {
        // Don't try and create a container if the container type has not been
        // selected.
        return;
      }
      // If the state is set for a new machine or container then actually add
      // the machine/container.
      if (selectedMachine === 'new' || selectedContainer === 'lxc' ||
          selectedContainer === 'kvm') {
        var machine = this.props.createMachine(
          selectedContainer, machineId, constraints);
      }
      // If the component has been provided a unit then we need to place the
      // unit on the machine/container.
      if (props.unit) {
        var id = machine && machine.id;
        props.placeUnit(props.unit, id || selectedContainer || selectedMachine);
      }
      this.props.close();
    },

    /**
      Get the parent id or selected machine.

      @method _getParentId
    */
    _getParentId: function() {
      var selectedMachine = this.state.selectedMachine;
      if (selectedMachine === 'new') {
        return null;
      }
      return this.props.parentId || selectedMachine;
    },

    /**
      Generate the constraints form.

      @method _generateConstraints
    */
    _generateConstraints: function() {
      return (
        <div className="add-machine__constraints" key='constraints'>
          <h4 className="add-machine__title">
            Define constraints
          </h4>
          <juju.components.Constraints
            valuesChanged={this._updateConstraints} />
        </div>);
    },

    /**
      Update the state with the selected container type.

      @method _updateSelectedContainer
      @param {Object} e The change event.
    */
    _updateSelectedContainer: function(e) {
      this.setState({selectedContainer: e.currentTarget.value});
    },

    /**
      Generate the container type form.

      @method _generateSelectContainer
    */
    _generateSelectContainer: function() {
      return (
        <select className="add-machine__container"
          defaultValue=""
          key="containers"
          onChange={this._updateSelectedContainer}>
          <option disabled={true} value="">
            Choose container type...
          </option>
          {this._generateContainerOptions()}
          <option value="lxc">LXC</option>
          <option value="kvm">KVM</option>
        </select>);
    },

    /**
      Update the state with the selected machine.

      @method _updateSelectedMachine
      @param {Object} e The change event.
    */
    _updateSelectedMachine: function(e) {
      this.setState({selectedMachine: e.currentTarget.value});
    },

    /**
      Generate machine selection.

      @method _generateSelectContainer
    */
    _generateSelectMachine: function() {
      return (
        <select
          defaultValue=""
          key="machines"
          onChange={this._updateSelectedMachine}>
          <option disabled={true} value="">
            Move to...
          </option>
          <option value="new">
            New machine
          </option>
          {this._generateMachineOptions()}
        </select>);
    },

    /**
      Generate a list of machine options.

      @method _generateMachineOptions
      @return {Array} A list of machine options.
    */
    _generateMachineOptions: function() {
      var components = [];
      var machines = this.props.machines.filterByParent();
      machines.forEach((machine) => {
        components.push(
          <option
            key={machine.id}
            value={machine.id}>
            {machine.displayName}
          </option>);
      });
      return components;
    },

    /**
      Generate a list of container options.

      @method _generateContainerOptions
      @return {Array} A list of container options.
    */
    _generateContainerOptions: function() {
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
        components.push(
          <option
            key={container.id}
            value={container.id}>
            {container.displayName}
          </option>);
      });
      return components;
    },

    /**
      Generate the buttons based on the state.

      @method _generateButtons
      @return {Object} The buttons.
    */
    _generateButtons: function() {
      var buttons = [{
        title: 'Cancel',
        action: this.props.close
      }, {
        title: this.props.unit ? 'Place' : 'Create',
        action: this._submitForm,
        type: 'confirm'
      }];
      return (
        <juju.components.ButtonRow
          buttons={buttons}
          key="buttons" />);
    },

    render: function() {
      var components = [];
      var props = this.props;
      var state = this.state;
      var machines = props.machines;
      var parentId = props.parentId;
      var selectedContainer = state.selectedContainer;
      var selectedMachine = state.selectedMachine;
      var unit = props.unit;
      if (unit && machines) {
        components.push(this._generateSelectMachine());
        if (selectedMachine) {
          if (selectedMachine !== 'new') {
            components.push(this._generateSelectContainer());
          }
          if (selectedMachine === 'new' || selectedContainer === 'kvm') {
            components.push(this._generateConstraints());
          }
          components.push(this._generateButtons());
        }
      } else if (!machines) {
        if (parentId) {
          components.push(this._generateSelectContainer());
        }
        if (!parentId || selectedContainer === 'kvm') {
          components.push(this._generateConstraints());
        }
        components.push(this._generateButtons());
      }
      return (
        <div className="add-machine">
          {components}
        </div>
      );
    }
  });
}, '0.1.0', {
  requires: [
    'button-row',
    'constraints'
  ]
});

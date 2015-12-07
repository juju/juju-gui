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
      parentId: React.PropTypes.string
    },

    /**
      Generate the initial state for the component.

      @method getInitialState
      @returns {Object} The initial state.
    */
    getInitialState: function() {
      return {
        constraints: null,
        containerType: null
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

      @method _createMachine
    */
    _createMachine: function() {
      // Don't try and create a container if the container type has not been
      // selected.
      if (this.props.parentId && !this.state.containerType) {
        return;
      }
      this.props.createMachine(
        this.state.containerType, this.props.parentId, this.state.constraints);
      this.props.close();

    },

    /**
      Generate the constraints form.

      @method _generateConstraints
    */
    _generateConstraints: function() {
      // Show the constraints if we're creating a machine or we're creating a
      // LXC container.
      if (this.props.parentId && this.state.containerType !== 'kvm') {
        return;
      }
      return (
        <div className="add-machine__constraints">
          <h4 className="add-machine__title">
            Define constraints
          </h4>
          <juju.components.Constraints
            valuesChanged={this._updateConstraints} />
        </div>);
    },

    /**
      Generate the container type form.

      @method _generateContainerType
      @param {Object} e The change event.
    */
    _updateContainerType: function(e) {
      this.setState({containerType: e.currentTarget.value});
    },

    /**
      Generate the container type form.

      @method _generateContainerType
    */
    _generateContainerType: function() {
      if (!this.props.parentId) {
        return;
      }
      return (
        <select className="add-machine__container-type"
          defaultValue=""
          onChange={this._updateContainerType}>
          <option disabled={true} value="">
            Choose container type...
          </option>
          <option value="lxc">LXC</option>
          <option value="kvm">KVM</option>
        </select>);
    },

    render: function() {
      var buttons = [{
        title: 'Cancel',
        action: this.props.close
      }, {
        title: 'Create',
        action: this._createMachine,
        type: 'confirm'
      }];
      return (
        <div className="add-machine">
          {this._generateContainerType()}
          {this._generateConstraints()}
          <juju.components.ButtonRow buttons={buttons} />
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

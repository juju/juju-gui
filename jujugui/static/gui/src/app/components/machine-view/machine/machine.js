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

YUI.add('machine-view-machine', function() {

  var dropTarget = {
    /**
      Called when something is dropped on the machine.
      See: http://gaearon.github.io/react-dnd/docs-drop-target.html

      @method drop
      @param {Object} props The component props.
      @param {Object} monitor A DropTargetMonitor.
      @param {Object} component The component that is being dropped onto.
    */
    drop: function (props, monitor, component) {
      var item = monitor.getItem();
      props.dropUnit(item.unit, props.machine.id);
    },

    /**
      Called to check whether something can be dropped on the component.

      @method drop
      @param {Object} props The component props.
      @param {Object} monitor A DropTargetMonitor.
    */
    canDrop: function (props, monitor) {
      return !props.acl.isReadOnly() && !props.machine.deleted;
    }
  };

  /**
    Provides props to be injected into the component.

    @method collect
    @param {Object} connect The connector.
    @param {Object} monitor A DropTargetMonitor.
  */
  function collect(connect, monitor) {
    return {
      canDrop: monitor.canDrop(),
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver()
    };
  }

  var MachineViewMachine = React.createClass({
    displayName: 'MachineViewMachine',

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      canDrop: React.PropTypes.bool.isRequired,
      connectDropTarget: React.PropTypes.func.isRequired,
      destroyMachines: React.PropTypes.func.isRequired,
      dropUnit: React.PropTypes.func.isRequired,
      genericConstraints: React.PropTypes.array,
      isOver: React.PropTypes.bool.isRequired,
      machine: React.PropTypes.object.isRequired,
      machineModel: React.PropTypes.object,
      providerType: React.PropTypes.string,
      removeUnit: React.PropTypes.func,
      selectMachine: React.PropTypes.func,
      selected: React.PropTypes.bool,
      series: React.PropTypes.array,
      services: React.PropTypes.object.isRequired,
      showConstraints: React.PropTypes.bool,
      type: React.PropTypes.string.isRequired,
      units: React.PropTypes.object.isRequired,
      updateMachineConstraints: React.PropTypes.func,
      updateMachineSeries: React.PropTypes.func
    },

    getInitialState: function() {
      return {
        constraints: null,
        showForm: false
      };
    },

    /**
      Toggle the display of the constraints form.
    */
    _toggleForm: function() {
      this.setState({showForm: !this.state.showForm});
    },

    /**
      Update the state with the new constraints.

      @param constraints {Object} The new constraints.
    */
    _updateConstraints: function(constraints) {
      this.setState({constraints: constraints});
    },

    /**
      Set the new constraints on the machine.
    */
    _setConstraints: function() {
      const constraints = this.state.constraints;
      const series = constraints.series || null;
      // The series is updated separately from the constraints, so remove it
      // from the object that is passed to the update constraints method.
      delete constraints.series;
      const id = this.props.machine.id;
      this.props.updateMachineConstraints(id, constraints);
      this.props.updateMachineSeries(id, series);
      this._toggleForm();
    },

    /**
      Generate the constraints form.

      @returns {Object} the form JSX.
    */
    _generateConstraintsForm: function() {
      if (!this.state.showForm) {
        return null;
      }
      const machine = this.props.machine;
      const disabled = this.props.acl.isReadOnly();
      const units = this.props.units.filterByMachine(
        machine.id, this.props.type === 'machine');
      const buttons = [{
        title: 'Cancel',
        action: this._toggleForm,
        type: 'base'
      }, {
        title: 'Update',
        action: this._setConstraints,
        type: 'neutral',
        disabled: disabled
      }];
      return (
        <div className="add-machine__constraints">
          <h4 className="add-machine__title">
            Update constraints
          </h4>
          <juju.components.Constraints
            constraints={this._getConstraints()}
            currentSeries={machine.series}
            disabled={disabled}
            hasUnit={!!units.length}
            providerType={this.props.providerType}
            series={this.props.series}
            valuesChanged={this._updateConstraints} />
          <juju.components.ButtonRow
            buttons={buttons}
            key="buttons" />
        </div>);
    },

    /**
      Get the constraints for the machine.

      @returns {Object} the machine constraints.
    */
    _getConstraints: function() {
      const constraints = this.props.machine.constraints || '';
      let types = {};
      // Map the list of constraint types to an object.
      this.props.genericConstraints.forEach(constraint => {
        types[constraint] = null;
      });
      // The machine constraints are always a string in the format:
      // cpu-power=w cores=x mem=y root-disk=z
      constraints.split(' ').forEach(part => {
        const keyVal = part.split('=');
        types[keyVal[0]] = keyVal[1];
      });
      return {
        arch: types.arch,
        cpuCores: types.cores,
        cpuPower: types['cpu-power'],
        disk: types['root-disk'],
        mem: types.mem
      };
    },

    /**
      Generate the hardware for a machine.

      @method _generateHardware
      @param {Integer} unitCount The number of units on the machine.
      @returns {Object} the machine hardware elements.
    */
    _generateHardware: function(unitCount) {
      if (this.props.type === 'container' || !this.props.showConstraints ||
          this.state.showForm) {
        return;
      }
      const machine = this.props.machine;
      const hardware = machine.hardware || this._getConstraints() || {};
      let hardwareDetails;
      let cpu = hardware.cpuPower;
      let disk = hardware.disk;
      let mem = hardware.mem;
      let cpuCores = hardware.cpuCores;
      if (cpuCores || cpu || disk || mem) {
        let details = [];
        if (cpuCores) {
          details.push(`cores: ${cpuCores}`);
        }
        if (cpu) {
          cpu = cpu / 100;
          details.push(`CPU: ${cpu}GHz`);
        }
        if (mem) {
          mem = mem / 1024;
          details.push(`mem: ${mem.toFixed(2)}GB`);
        }
        if (disk) {
          disk = disk / 1024;
          details.push(`disk: ${disk.toFixed(2)}GB`);
        }
        const constraintsMessage = machine.constraints ?
          'requested constraints: ' : '';
        hardwareDetails = `${constraintsMessage}${details.join(', ')}`;
      }
      if (!hardwareDetails) {
        if (machine.commitStatus === 'uncommitted') {
          hardwareDetails = 'no constraints set';
        } else {
          hardwareDetails = 'hardware details not available';
        }
      }
      const plural = unitCount === 1 ? '' : 's';
      const series = machine.series ? `${machine.series},` : undefined;
      return (
        <div className="machine-view__machine-hardware">
          {unitCount} unit{plural}, {series} {hardwareDetails}
        </div>);
    },

    /**
      Generate the unit icons for the machine.

      @method _generateUnits
      @returns {Object} the unit elements.
    */
    _generateUnits: function() {
      if (this.state.showForm) {
        return null;
      }
      var includeChildren = this.props.type === 'machine';
      var units = this.props.units.filterByMachine(
        this.props.machine.id, includeChildren);
      if (units.length === 0) {
        return;
      }
      var components = [];
      units.forEach((unit) => {
        var service = this.props.services.getById(unit.service);
        if (this.props.type === 'machine' && (service.get('hide')
          || service.get('fade'))) {
          return;
        }
        components.push(
          <juju.components.MachineViewMachineUnit
            acl={this.props.acl}
            key={unit.id}
            machineType={this.props.type}
            removeUnit={this.props.removeUnit}
            service={service}
            unit={unit} />);
      });
      return (
        <ul className="machine-view__machine-units">
          {components}
        </ul>);
    },

    /**
      Handle destroying a machine.

      @method _destroyMachine
    */
    _destroyMachine: function() {
      this.props.destroyMachines([this.props.machine.id], true);
    },

    /**
      Handle selecting a machine.

      @method _handleSelectMachine
    */
    _handleSelectMachine: function() {
      var selectMachine = this.props.selectMachine;
      if (selectMachine) {
        selectMachine(this.props.machine.id);
      }
    },

    /**
      Generate the classes for the machine.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      var machine = this.props.machine;
      var classes = {
        'machine-view__machine--drop': this.props.isOver && this.props.canDrop,
        'machine-view__machine--selected': this.props.selected,
        'machine-view__machine--uncommitted': machine.deleted ||
          machine.commitStatus === 'uncommitted',
        'machine-view__machine--root': machine.root
      };
      classes['machine-view__machine--' + this.props.type] = true;
      return classNames(
        'machine-view__machine',
        classes
      );
    },

    render: function() {
      var machine = this.props.machine;
      var units = this.props.units.filterByMachine(machine.id, true);
      var menuItems = [{
        label: 'Destroy',
        action: !this.props.acl.isReadOnly() && this._destroyMachine
      }];
      if (this.props.type === 'machine' &&
          machine.commitStatus === 'uncommitted') {
        menuItems.push({
          label: 'Update constraints',
          action: !this.props.acl.isReadOnly() && this._toggleForm
        });
      }
      // Wrap the returned components in the drop target method.
      return this.props.connectDropTarget(
        <div className={this._generateClasses()}
          onClick={this._handleSelectMachine}
          role="button"
          tabIndex="0">
          <juju.components.MoreMenu
            items={menuItems} />
          <div className="machine-view__machine-name">
            {this.props.machine.displayName}
          </div>
          {this._generateHardware(units.length)}
          {this._generateUnits()}
          {this._generateConstraintsForm()}
          <div className="machine-view__machine-drop-target">
            <div className="machine-view__machine-drop-message">
              Add to {this.props.machine.displayName}
            </div>
          </div>
        </div>
      );
    }
  });

  juju.components.MachineViewMachine = ReactDnD.DropTarget(
    'unit', dropTarget, collect)(MachineViewMachine);

}, '0.1.0', {
  requires: [
    'machine-view-machine-unit',
    'more-menu'
  ]
});

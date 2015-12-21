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
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver()
    };
  }

  var MachineViewMachine = React.createClass({
    propTypes: {
      destroyMachines: React.PropTypes.func.isRequired,
      machine: React.PropTypes.object.isRequired,
      removeUnit: React.PropTypes.func,
      dropUnit: React.PropTypes.func.isRequired,
      selected: React.PropTypes.bool,
      selectMachine: React.PropTypes.func,
      showConstraints: React.PropTypes.bool,
      services: React.PropTypes.object.isRequired,
      type: React.PropTypes.string.isRequired,
      units: React.PropTypes.object.isRequired
    },

    /**
      Generate the hardware for a machine.

      @method _generateHardware
      @param {Integer} unitCount The number of units on the machine.
      @returns {Object} the machine hardware elements.
    */
    _generateHardware: function(unitCount) {
      if (this.props.type === 'container' || !this.props.showConstraints) {
        return;
      }
      var machine = this.props.machine;
      var hardware = machine.hardware;
      var hardwareDetails;
      if (hardware) {
        var cpu = hardware.cpuPower;
        var disk = hardware.disk;
        var mem = hardware.mem;
        var cpuCores = hardware.cpuCores;
        if (cpuCores && cpu && disk && mem && disk) {
          cpu = cpu / 100;
          disk = disk / 1024;
          mem = mem / 1024;
          hardwareDetails = `${cpuCores}x${cpu}GHz, ${mem.toFixed(2)}GB, ` +
          `${disk.toFixed(2)}GB`;
        }
      }
      if (!hardwareDetails) {
        hardwareDetails = 'hardware details not available';
      }
      var plural = unitCount === 1 ? '' : 's';
      var series = machine.series ? `${machine.series}, ` : undefined;
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
      var includeChildren = this.props.type === 'machine';
      var units = this.props.units.filterByMachine(
        this.props.machine.id, includeChildren);
      if (units.length === 0) {
        return;
      }
      var components = [];
      units.forEach((unit) => {
        var menu;
        var title;
        if (this.props.type === 'container') {
          var menuItems = [{
            label: 'Destroy',
            action: this.props.removeUnit.bind(null, unit.id)
          }];
          menu = (
            <juju.components.MoreMenu
              items={menuItems} />);
          title = unit.displayName;
        }
        var service = this.props.services.getById(unit.service);
        components.push(
          <li className={this._generateUnitClasses(unit)}
            key={unit.id}>
            <span className="machine-view__machine-unit-icon">
              <img
                alt={unit.displayName}
                src={service.get('icon')}
                title={unit.displayName} />
            </span>
            {title}
            {menu}
          </li>);
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
      this.props.destroyMachines([this.props.machine.id]);
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
        'machine-view__machine--drop': this.props.isOver,
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

    /**
      Generate the classes for a unit.

      @method _generateUnitClasses
      @param {Object} unit The unit to generate classes for.
      @returns {String} The collection of class names.
    */
    _generateUnitClasses: function(unit) {
      return classNames(
        'machine-view__machine-unit', {
          'machine-view__machine-unit--uncommitted':
            unit.deleted || !unit.agent_state
        });
    },

    render: function() {
      var machine = this.props.machine;
      var units = this.props.units.filterByMachine(machine.id, true);
      var menuItems = [{
        label: 'Destroy',
        action: this._destroyMachine
      }];
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
    'more-menu'
  ]
});

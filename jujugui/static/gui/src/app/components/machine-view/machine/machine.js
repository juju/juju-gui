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

  juju.components.MachineViewMachine = React.createClass({
    propTypes: {
      destroyMachines: React.PropTypes.func.isRequired,
      machine: React.PropTypes.object.isRequired,
      removeUnit: React.PropTypes.func,
      selected: React.PropTypes.bool,
      selectMachine: React.PropTypes.func,
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
      if (this.props.type === 'container') {
        return;
      }
      var machine = this.props.machine;
      var hardware = machine.hardware;
      if (!hardware) {
        return (
          <div className="machine-view__machine-hardware">
            Hardware details not available
          </div>);
      }
      var cpu = hardware.cpuPower / 100;
      var disk = hardware.disk / 1024;
      var mem = hardware.mem / 1024;
      var plural = unitCount === 1 ? '' : 's';
      return (
        <div className="machine-view__machine-hardware">
          {unitCount} unit{plural}, {hardware.cpuCores}x{cpu}GHz,{' '}
          {mem.toFixed(2)}GB, {disk.toFixed(2)}GB
        </div>);
    },

    /**
      Generate the unit icons for the machine.

      @method _generateUnits
      @param {Array} units The units for the machine.
      @returns {Object} the unit elements.
    */
    _generateUnits: function(units) {
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
          <li className="machine-view__machine-unit"
            key={unit.id}>
            <img
              alt={unit.displayName}
              src={service.get('icon')}
              title={unit.displayName} />
            {title}
            {menu}
          </li>);
      });
      return components;
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
      var units = this.props.units.filterByMachine(machine.id);
      var menuItems = [{
        label: 'Destroy',
        action: this._destroyMachine
      }];
      return (
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
          <ul className="machine-view__machine-units">
            {this._generateUnits(units)}
          </ul>
        </div>
      );
    }
  });
}, '0.1.0', {
  requires: [
    'more-menu'
  ]
});

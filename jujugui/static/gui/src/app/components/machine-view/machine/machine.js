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
      machine: React.PropTypes.object.isRequired,
      selected: React.PropTypes.bool.isRequired,
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
      var machine = this.props.machine;
      var hardware = machine.hardware;
      if (!hardware) {
        return (
          <div>
            Hardware details not available
          </div>);
      }
      var cpu = hardware.cpuPower / 100;
      var disk = hardware.disk / 1024;
      var mem = hardware.mem / 1024;
      var plural = unitCount === 1 ? '' : 's';
      return (
        <div>
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
        var service = this.props.services.getById(unit.service);
        components.push(
          <img
            alt={unit.displayName}
            key={unit.id}
            src={service.get('icon')}
            title={unit.displayName} />);
      });
      return components;
    },

    /**
      Generate the classes machine.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      var classes = {
        'machine-view__machine--selected': this.props.selected,
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
      return (
        <div className={this._generateClasses()}
          onClick={this.props.selectMachine}
          role="button"
          tabIndex="0">
          <div className="machine-view__machine-name">
            {this.props.machine.displayName}
          </div>
          <div className="machine-view__machine-hardware">
            {this._generateHardware(units.length)}
          </div>
          <div className="machine-view__machine-units">
            {this._generateUnits(units)}
          </div>
        </div>
      );
    }
  });
}, '0.1.0', {
  requires: [
  ]
});

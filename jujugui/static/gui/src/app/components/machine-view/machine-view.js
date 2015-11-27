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

YUI.add('machine-view', function() {

  juju.components.MachineView = React.createClass({
    propTypes: {
      environmentName: React.PropTypes.string.isRequired,
      machines: React.PropTypes.object.isRequired,
      services: React.PropTypes.object.isRequired,
      units: React.PropTypes.object.isRequired
    },

    /**
      Display a list of unplaced units or onboarding.

      @method _generateUnplacedUnits
      @returns {Object} A unit list or onboarding.
    */
    _generateUnplacedUnits: function() {
      var units = this.props.units.filterByMachine();
      if (units.length === 0) {
        var icon;
        var content;
        if (this.props.services.size() === 0) {
          icon = 'add_16';
          content = 'Add services to get started';
        } else {
          icon = 'task-done_16';
          content = 'You have placed all of your units';
        }
        return (
          <div className="machine-view__column-onboarding">
            <juju.components.SvgIcon name={icon}
              size="16" />
            {content}
          </div>);
      }
      var components = [];
      units.forEach((unit) => {
        var service = this.props.services.getById(unit.service);
        components.push(
          <juju.components.MachineViewUnplacedUnit
            key={unit.id}
            icon={service.get('icon')}
            unit={unit} />);
      });
      return (
        <ul className="machine-view__list">
          {components}
        </ul>);
    },

    /**
      Generate the title for the machine column header.

      @method _generateMachinesTitle
      @returns {String} the machine header title.
    */
    _generateMachinesTitle: function() {
      var machines = this.props.machines.filterByParent();
      return `${this.props.environmentName} (${machines.length})`;
    },

    /**
      Generate the title for the container column header.

      @method _generateContainersTitle
      @returns {String} the container header title.
    */
    _generateContainersTitle: function() {
      return '0 containers, 0 units';
    },

    render: function() {
      return (
        <div className="machine-view">
          <div className="machine-view__content">
            <div className="machine-view__column">
              <juju.components.MachineViewHeader
                title="New units" />
              <div className="machine-view__column-content">
                {this._generateUnplacedUnits()}
              </div>
            </div>
            <div className="machine-view__column">
              <juju.components.MachineViewHeader
                title={this._generateMachinesTitle()} />
            </div>
            <div className="machine-view__column">
              <juju.components.MachineViewHeader
                title={this._generateContainersTitle()} />
            </div>
          </div>
        </div>
      );
    }
  });
}, '0.1.0', {
  requires: [
    'machine-view-header',
    'machine-view-unplaced-unit',
    'svg-icon'
  ]
});

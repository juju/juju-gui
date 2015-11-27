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
      machines: React.PropTypes.object.isRequired,
      environmentName: React.PropTypes.string.isRequired
    },

    /**
      Generate the title for the machine column header.

      @method _generateMachinesTitle
    */
    _generateMachinesTitle: function() {
      var machines = this.props.machines.filterByParent();
      return `${this.props.environmentName} (${machines.length})`;
    },

    /**
      Generate the title for the container column header.

      @method _generateContainersTitle
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
    'machine-view-header'
  ]
});

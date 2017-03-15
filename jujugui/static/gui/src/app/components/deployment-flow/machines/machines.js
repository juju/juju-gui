/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

YUI.add('deployment-machines', function() {

  juju.components.DeploymentMachines = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      cloud: React.PropTypes.object,
      machines: React.PropTypes.object
    },

    /**
      Generate the list of machines

      @method _generateMachines
      @returns {Object} The list of machines.
    */
    _generateMachines: function() {

      const machines = this.props.machines;
      if (!machines || Object.keys(machines).length === 0) {
        return;
      }
      let machineDetails = {};
      Object.keys(machines).forEach(key => {
        const machine = machines[key];
        let constraintsDetails;
        const args = machine.command.args[0][0];
        const series = args.series;
        const constraints = args.constraints || {};
        let cpu = constraints['cpu-power'];
        let disk = constraints['root-disk'];
        let mem = constraints.mem;
        const cores = constraints.cores;
        const parts = [];
        if (cores && cpu && disk && mem) {
          // Until we have a better way of handling the various units, just
          // display the constraint without manipulation. See 7e7fd27 for the
          // massaged, prettier output.
          cpu = cpu / 100;
          constraintsDetails = `${cores}x${cpu}GHz, ${mem}, ${disk}`;
        }
        if (series) {
          parts.push(`${series}${constraintsDetails ? ',' : ''}`);
        }
        parts.push(constraintsDetails || '(constraints not set)');
        const info = parts.join(' ');
        const current = machineDetails[info] || 0;
        machineDetails[info] = current + 1;
      });
      const cloud = this.props.cloud && this.props.cloud.name;
      const machineList = Object.keys(machineDetails).map(machine => {
        const count = machineDetails[machine];
        return (
          <li className="deployment-flow__row twelve-col"
            key={machine}>
            <div className="eight-col">
              {machine}
            </div>
            <div className="three-col">
              {cloud}
            </div>
            <div className="one-col last-col">
              {count}
            </div>
          </li>);
      });
      return (
        <ul className="deployment-machines__list">
          <li className="deployment-flow__row-header twelve-col">
            <div className="eight-col">
              Type
            </div>
            <div className="three-col">
              Provider
            </div>
            <div className="one-col last-col">
              Quantity
            </div>
          </li>
          {machineList}
        </ul>);
    },

    render: function() {
      let chargeMessage = '';
      const cloudName = this.props.cloud ? this.props.cloud.name : 'the cloud';
      if (cloudName !== 'localhost') {
        chargeMessage = 'You will incur a charge from your cloud provider.';
      }
      return (
        <div>
          <p className="deployment-machines__message">
            These machines will be provisioned on {cloudName}.&nbsp;
            {chargeMessage}
          </p>
          {this._generateMachines()}
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});

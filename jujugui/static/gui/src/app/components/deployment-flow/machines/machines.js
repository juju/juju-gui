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
      cloud: React.PropTypes.object
    },

    /**
      Generate the list of machines

      @method _generateMachines
      @returns {Object} The list of machines.
    */
    _generateMachines: function() {
      // Create a fake list of machines until we can get the correct data.
      var machines = [1, 2];
      if (!machines || machines.length === 0) {
        return;
      }
      var machineList = machines.map((machine, i) => {
        return (
          <li className="deployment-flow__row twelve-col"
            key={i}>
            <div className="eight-col">
              Trusty, 1x1GHz, 1.70GB, 8.00GB
            </div>
            <div className="three-col">
              Google
            </div>
            <div className="one-col last-col">
              4
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
      return (
        <juju.components.DeploymentSection
          completed={false}
          disabled={!this.props.cloud}
          instance="deployment-machines"
          showCheck={false}
          title="Machines to be deployed">
          <p className="deployment-machines__message">
            These machines will be provisioned on&nbsp;
            {this.props.cloud && this.props.cloud.title}.
            You will incur a charge from your cloud provider.
          </p>
          {this._generateMachines()}
        </juju.components.DeploymentSection>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-section',
    'svg-icon'
  ]
});

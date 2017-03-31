/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

/**
  This component allows users to provide their AWS virtual private cloud
  identifier.
*/
YUI.add('deployment-vpc', function() {

  juju.components.DeploymentVPC = React.createClass({
    propTypes: {
      setVPCId: React.PropTypes.func.isRequired
    },

    /**
      Handle VPC id changes.

      @method _onInputBlur
      @param {Object} evt The blur event.
    */
    _onInputBlur: function(evt) {
      const value = this.refs.vpcId.getValue();
      this.props.setVPCId(value);
    },

    /**
      Render the component.

      @method render
    */
    render: function() {
      return (
        <div>
          <p>
            Optionally use a specific AWS VPC ID. When not specified, Juju
            requires a default VPC or EC2-Classic features to be available for
            the account/region.
          </p>
          <juju.components.GenericInput
            label="VPC id"
            key="vpcId"
            ref="vpcId"
            multiLine={false}
            onBlur={this._onInputBlur}
            required={false}
          />
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: []
});

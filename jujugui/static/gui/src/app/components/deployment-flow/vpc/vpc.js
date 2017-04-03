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

    getInitialState: function() {
      return {force: false, forceEnabled: false};
    },

    /**
      Handle text input blur changes by setting the VPC data.

      @param {Object} evt The blur event.
    */
    _onInputBlur: function(evt) {
      this.setVPC(this.state.force);
    },

    /**
      Handle text input key up events by disabling or enabling the VPC force
      check box based on whether the input is empty.

      @param {Object} evt The key up event.
    */
    _onInputKeyUp: function(evt) {
      this.setState({forceEnabled: !!this.refs.vpcId.getValue()});
    },

    /**
      Handle VPC force check box changes by updating the VPC data.

      @param {Object} evt The change event from the check box.
    */
    _onCheckboxChange: function(evt) {
      const force = evt.target.checked;
      this.setState({force: force});
      this.setVPC(force);
    },

    /**
      Stop the propagation of VPC force check box click events.

      @param {Object} evt The change event from the check box.
    */
    _onCheckboxClick: function(evt) {
      evt.stopPropagation();
    },

    /**
      Set VPC id and force values based on the current state of VPC widgets.

      @param {Boolean} force Whether to force the id value, even if not valid.
    */
    setVPC: function(force) {
      this.props.setVPCId(this.refs.vpcId.getValue(), force);
    },

    /**
      Render the component.
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
            onKeyUp={this._onInputKeyUp}
            required={false}
          />
          <input
            type="checkbox"
            id="vpcIdForce"
            onChange={this._onCheckboxChange}
            onClick={this._onCheckboxClick}
            checked={this.state.force}
            disabled={!this.state.forceEnabled}
          />
          &nbsp;
          Force Juju to use the AWS VPC ID specified above, even when it fails
          the minimum validation criteria. This is ignored if VPC ID is not
          set.
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: []
});

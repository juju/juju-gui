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
class DeploymentVPC extends React.Component {
  constructor() {
    super();
    this.state = {force: false, forceEnabled: false};
  }

  /**
    Handle text input blur changes by setting the VPC data.

    @param {Object} evt The blur event.
  */
  _onInputBlur(evt) {
    this.setVPC(this.state.force);
  }

  /**
    Handle text input key up events by disabling or enabling the VPC force
    check box based on whether the input is empty.

    @param {Object} evt The key up event.
  */
  _onInputKeyUp(evt) {
    this.setState({forceEnabled: !!this.refs.vpcId.getValue()});
  }

  /**
    Handle VPC force check box changes by updating the VPC data.

    @param {Object} evt The change event from the check box.
  */
  _onCheckboxChange(evt) {
    const force = evt.target.checked;
    this.setState({force: force});
    this.setVPC(force);
  }

  /**
    Stop the propagation of VPC force check box click events.

    @param {Object} evt The change event from the check box.
  */
  _onCheckboxClick(evt) {
    evt.stopPropagation();
  }

  /**
    Set VPC id and force values based on the current state of VPC widgets.

    @param {Boolean} force Whether to force the id value, even if not valid.
  */
  setVPC(force) {
    this.props.setVPCId(this.refs.vpcId.getValue(), force);
  }

  /**
    Render the component.
  */
  render() {
    const vpcLink =
    'http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/default-vpc.html';
    return (
      <div className="twelve-col no-margin-bottom">
        <p>Juju uses your default VPC – or you can specify one here.</p>
        <p>AWS accounts created since December 2013 have this –&nbsp;
          older accounts may not.&nbsp;
          <a className="link"
            target="_blank" href={vpcLink}>Default VPC basics.</a>
        </p>
        <div className="six-col">
          <juju.components.GenericInput
            label="VPC ID"
            key="vpcId"
            ref="vpcId"
            multiLine={false}
            onBlur={this._onInputBlur.bind(this)}
            onKeyUp={this._onInputKeyUp.bind(this)}
            required={false}
          />
          <label>
            <input
              type="checkbox"
              id="vpcIdForce"
              onChange={this._onCheckboxChange.bind(this)}
              onClick={this._onCheckboxClick.bind(this)}
              checked={this.state.force}
              disabled={!this.state.forceEnabled}
            />
            &nbsp;
            Always use this ID
          </label>
        </div>
      </div>
    );
  }
};

DeploymentVPC.propTypes = {
  setVPCId: PropTypes.func.isRequired
};

YUI.add('deployment-vpc', function() {
  juju.components.DeploymentVPC = DeploymentVPC;
}, '0.1.0', {
  requires: [
    'generic-input'
  ]
});

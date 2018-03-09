/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericInput = require('../../generic-input/generic-input');
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
        <p>
          AWS accounts created since December 2013 have this –&nbsp;
          older accounts may not.&nbsp;
          <a className="link"
            href={vpcLink} target="_blank">Default VPC basics.</a>
        </p>
        <div className="six-col">
          <GenericInput
            key="vpcId"
            label="VPC ID"
            multiLine={false}
            onBlur={this._onInputBlur.bind(this)}
            onKeyUp={this._onInputKeyUp.bind(this)}
            ref="vpcId"
            required={false} />
          <label>
            <input
              checked={this.state.force}
              disabled={!this.state.forceEnabled}
              id="vpcIdForce"
              onChange={this._onCheckboxChange.bind(this)}
              onClick={this._onCheckboxClick.bind(this)}
              type="checkbox" />
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

module.exports = DeploymentVPC;

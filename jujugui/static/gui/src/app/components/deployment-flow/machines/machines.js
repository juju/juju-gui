/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

class DeploymentMachines extends React.Component {
  /**
    Generate the list of machines

    @method _generateMachines
    @returns {Object} The list of machines.
  */
  _generateMachines() {
    const machines = this.props.machines;
    if (!machines || Object.keys(machines).length === 0) {
      return;
    }
    let machineDetails = {};
    Object.keys(machines).forEach(key => {
      const machine = machines[key];
      const args = machine.command.args[0][0];
      const info = this.props.initUtils.generateMachineDetails({
        commitStatus: 'uncommitted',
        constraints: this.props.initUtils.formatConstraints(args.constraints),
        id: machine.command.options.modelId,
        series: args.series
      });
      const current = machineDetails[info] || 0;
      machineDetails[info] = current + 1;
    });
    const cloud = this.props.cloud && this.props.cloud.name;
    const machineList = Object.keys(machineDetails).map(machine => {
      const count = machineDetails[machine];
      return (
        <li
          className="deployment-flow__row twelve-col"
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
  }

  render() {
    let chargeMessage = '';
    const cloudName = this.props.cloud ? this.props.cloud.name : 'the cloud';
    if (cloudName !== 'localhost') {
      chargeMessage = 'You may incur charges from your cloud provider.';
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
};

DeploymentMachines.propTypes = {
  acl: PropTypes.object.isRequired,
  cloud: PropTypes.object,
  initUtils: shapeup.shape({
    formatConstraints: PropTypes.func.isRequired,
    generateMachineDetails: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  }).isRequired,
  machines: PropTypes.object
};

module.exports = DeploymentMachines;

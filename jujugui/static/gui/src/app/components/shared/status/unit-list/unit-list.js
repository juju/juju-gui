/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const StatusLabel = require('../label/label');
const StatusTable = require('../table/table');

const maracaPropTypes = require('../../../../maraca/prop-types');
const utils = require('../../utils');

class StatusUnitList extends React.Component {

  /**
    Format the ports ranges for a unit
    @param ranges {Array} The port ranges.
    @returns {String} The formatted port ranges.
  */
  _formatPorts(ranges) {
    if (!ranges) {
      return '';
    }
    return ranges.map(range => {
      if (range.fromPort === range.toPort) {
        return `${range.fromPort}/${range.protocol}`;
      }
      return `${range.fromPort}-${range.toPort}/${range.protocol}`;
    }).join(', ');
  }

  /**
    Generate the unit rows.
    @returns {Array} The list of rows. The returned array and containing objects
      should match the row format required by the BasicTable component.
  */
  _generateRows() {
    const {units} = this.props;
    return Object.keys(units).map(key => {
      const unit = units[key];
      let application = this.props.applications[unit.application];
      const appExposed = application.exposed;
      let publicAddress = unit.publicAddress;
      if (appExposed && unit.portRanges.length) {
        const port = unit.portRanges[0].fromPort;
        const label = `${unit.publicAddress}:${port}`;
        const protocol = port === 443 ? 'https' : 'http';
        const href = `${protocol}://${label}`;
        publicAddress = (
          <a
            className="status-view__link"
            href={href}
            target="_blank">
            {unit.publicAddress}
          </a>);
      }
      const agentStatus = unit.agentStatus.current;
      const workloadStatus = unit.workloadStatus.current;
      return {
        classes: [utils.getStatusClass(
          'status-table__row--',
          [agentStatus, workloadStatus])],
        onClick: this.props.generateUnitOnClick(unit.name),
        clickURL: this.props.generateUnitURL(unit.name),
        columns: [{
          columnSize: 2,
          content: (
            <span>
              <img className="status-view__icon" src={this.props.getIconPath(application)} />
              {unit.name}
            </span>)
        }, {
          columnSize: 2,
          content: workloadStatus ? (
            <StatusLabel status={workloadStatus} />) : null
        }, {
          columnSize: 2,
          content: agentStatus ? (
            <StatusLabel status={agentStatus} />) : null
        }, {
          columnSize: 1,
          content: (
            <a
              className="status-view__link"
              href={this.props.generateMachineURL(unit.machineID)}
              onClick={this.props.onMachineClick.bind(this, unit.machineID)}>
              {unit.machineID}
            </a>)
        }, {
          columnSize: 2,
          content: publicAddress
        }, {
          columnSize: 1,
          content: this._formatPorts(unit.portRanges)
        }, {
          columnSize: 2,
          content: unit.workloadStatus.message
        }],
        extraData: utils.getHighestStatus(
          [agentStatus, workloadStatus]),
        key: unit.name
      };
    });
  }

  render() {
    const headers = [{
      content: 'Unit',
      columnSize: 2
    }, {
      content: 'Workload',
      columnSize: 2
    }, {
      content: 'Agent',
      columnSize: 2
    }, {
      content: 'Machine',
      columnSize: 1
    }, {
      content: 'Public address',
      columnSize: 2
    }, {
      content: 'Ports',
      columnSize: 1
    }, {
      content: 'Message',
      columnSize: 2
    }];
    return (
      <StatusTable
        headers={headers}
        rows={this._generateRows()}
        statusFilter={this.props.statusFilter} />);
  }
};

StatusUnitList.propTypes = {
  applications: maracaPropTypes.applications,
  generateMachineURL: PropTypes.func.isRequired,
  generateUnitOnClick: PropTypes.func.isRequired,
  generateUnitURL: PropTypes.func.isRequired,
  getIconPath: PropTypes.func.isRequired,
  onMachineClick: PropTypes.func.isRequired,
  statusFilter: PropTypes.string,
  units: maracaPropTypes.units
};

module.exports = StatusUnitList;

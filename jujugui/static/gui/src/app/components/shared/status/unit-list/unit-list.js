/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const StatusLabel = require('../label/label');
const StatusTable = require('../table/table');

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
      if (range.from === range.to) {
        return `${range.from}/${range.protocol}`;
      }
      return `${range.from}-${range.to}/${range.protocol}`;
    }).join(', ');
  }

  /**
    Generate the unit rows.
    @returns {Array} The list of rows. The returned array and containing objects
      should match the row format required by the BasicTable component.
  */
  _generateRows() {
    const units = utils.getRealUnits(this.props.units);
    return units.map(unit => {
      let application;
      this.props.applications.some(app => {
        if (app.get('name') === unit.service) {
          application = app;
          return true;
        }
      });
      const appExposed = application.get('exposed');
      let publicAddress = unit.public_address;
      if (appExposed && unit.portRanges.length) {
        const port = unit.portRanges[0].from;
        const label = `${unit.public_address}:${port}`;
        const protocol = port === 443 ? 'https' : 'http';
        const href = `${protocol}://${label}`;
        publicAddress = (
          <a className="status-view__link"
            href={href}
            target="_blank">
            {unit.public_address}
          </a>);
      }
      return {
        classes: [utils.getStatusClass(
          'status-table__row--',
          [unit.agentStatus, unit.workloadStatus])],
        onClick: this.props.generateUnitOnClick(unit.id),
        clickURL: this.props.generateUnitURL(unit.id),
        columns: [{
          columnSize: 2,
          content: (
            <span>
              <img className="status-view__icon"
                src={application.get('icon')} />
              {unit.displayName}
            </span>)
        }, {
          columnSize: 2,
          content: unit.workloadStatus ? (
            <StatusLabel status={unit.workloadStatus} />) : null
        }, {
          columnSize: 2,
          content: unit.agentStatus ? (
            <StatusLabel status={unit.agentStatus} />) : null
        }, {
          columnSize: 1,
          content: (
            <a className="status-view__link"
              href={this.props.generateMachineURL(unit.machine)}
              onClick={this.props.onMachineClick.bind(this, unit.machine)}>
              {unit.machine}
            </a>)
        }, {
          columnSize: 2,
          content: publicAddress
        }, {
          columnSize: 1,
          content: this._formatPorts(unit.portRanges)
        }, {
          columnSize: 2,
          content: unit.workloadStatusMessage
        }],
        extraData: utils.getHighestStatus(
          [unit.agentStatus, unit.workloadStatus]),
        key: unit.id
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
  applications: PropTypes.array.isRequired,
  generateMachineURL: PropTypes.func.isRequired,
  generateUnitOnClick: PropTypes.func.isRequired,
  generateUnitURL: PropTypes.func.isRequired,
  onMachineClick: PropTypes.func.isRequired,
  statusFilter: PropTypes.string,
  units: PropTypes.array.isRequired
};

module.exports = StatusUnitList;

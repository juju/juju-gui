/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const maracaPropTypes = require('../../../../maraca/prop-types');
const StatusLabel = require('../label/label');
const StatusTable = require('../table/table');

const {
  getStatusClass,
  normaliseStatus
} = require('../../utils');

class StatusMachineList extends React.Component {

  /**
    Generate the machine rows.
    @returns {Array} The list of rows.
  */
  _generateRows() {
    const {machines} = this.props;
    return Object.keys(machines).map(key => {
      const machine = machines[key];
      let publicAddress;
      machine.addresses.some(address => {
        if (address.scope === 'public') {
          publicAddress = address.value;
          return true;
        }
      });
      const agentStatus = machine.agentStatus.current;
      return {
        classes: [getStatusClass(
          'status-table__row--', agentStatus)],
        onClick: this.props.generateMachineOnClick(machine.id),
        clickURL: this.props.generateMachineURL(machine.id),
        columns: [{
          columnSize: 1,
          content: machine.id
        }, {
          columnSize: 2,
          content: agentStatus ? (
            <StatusLabel status={agentStatus} />) : null
        }, {
          columnSize: 2,
          content: publicAddress
        }, {
          columnSize: 3,
          content: machine.instanceID
        }, {
          columnSize: 1,
          content: machine.series
        }, {
          columnSize: 3,
          content: machine.agentStatus.message
        }],
        extraData: normaliseStatus(agentStatus),
        key: machine.id
      };
    });
  }

  render() {
    const headers = [{
      content: 'Machine',
      columnSize: 1
    }, {
      content: 'State',
      columnSize: 2
    }, {
      content: 'DNS',
      columnSize: 2
    }, {
      content: 'Instance ID',
      columnSize: 3
    }, {
      content: 'Series',
      columnSize: 1
    }, {
      content: 'Message',
      columnSize: 3
    }];
    return (
      <StatusTable
        headers={headers}
        rows={this._generateRows()}
        statusFilter={this.props.statusFilter} />
    );
  }
};

StatusMachineList.propTypes = {
  generateMachineOnClick: PropTypes.func.isRequired,
  generateMachineURL: PropTypes.func.isRequired,
  machines: maracaPropTypes.machines,
  statusFilter: PropTypes.string
};

module.exports = StatusMachineList;

/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

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
    return this.props.machines.map(machine => {
      return {
        classes: [getStatusClass(
          'status-table__row--', machine.agent_state)],
        clickState: this.props.generateMachineClickState(machine.id),
        columns: [{
          columnSize: 1,
          content: machine.displayName
        }, {
          columnSize: 2,
          content: machine.agent_state ? (
            <StatusLabel status={machine.agent_state} />) : null
        }, {
          columnSize: 2,
          content: machine.public_address
        }, {
          columnSize: 3,
          content: machine.instance_id
        }, {
          columnSize: 1,
          content: machine.series
        }, {
          columnSize: 3,
          content: machine.agent_state_info
        }],
        extraData: normaliseStatus(machine.agent_state),
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
        changeState={this.props.changeState}
        generatePath={this.props.generatePath}
        headers={headers}
        rows={this._generateRows()}
        statusFilter={this.props.statusFilter} />
    );
  }
};

StatusMachineList.propTypes = {
  changeState: PropTypes.func.isRequired,
  generateMachineClickState: PropTypes.func.isRequired,
  generatePath: PropTypes.func.isRequired,
  machines: PropTypes.array.isRequired,
  statusFilter: PropTypes.string
};

module.exports = StatusMachineList;

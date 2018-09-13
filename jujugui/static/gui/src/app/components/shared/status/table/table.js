/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const BasicTable = require('../../basic-table/basic-table');

class StatusTable extends React.Component {
  /**
    A function to be supplied to sort methods to sort by key.
    @param {String} a The first value.
    @param {String} b The second value.
    @returns {Int} The position change.
  */
  _byKey(a, b) {
    if (a.key < b.key) {
      return -1;
    }
    if (a.key > b.key) {
      return 1;
    }
    return 0;
  }

  /**
    Filter a row by the status.
    @param row {Object} The row values.
    @returns {Boolean} Whether the row matches the status.
  */
  _filterByStatus(row) {
    if (!this.props.statusFilter) {
      return true;
    }
    return row.extraData === this.props.statusFilter;
  }

  render() {
    return (
      <BasicTable
        filterPredicate={this._filterByStatus.bind(this)}
        headerClasses={['status-table__header']}
        headerColumnClasses={['status-table__header-column']}
        headers={this.props.headers}
        rowClasses={['status-table__row']}
        rowColumnClasses={['status-table__column']}
        rows={this.props.rows.sort(this._byKey.bind(this, 0))}
        sort={this._byKey}
        tableClasses={['status-table']} />
    );
  }
};

StatusTable.propTypes = {
  headers: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  statusFilter: PropTypes.string
};

module.exports = StatusTable;

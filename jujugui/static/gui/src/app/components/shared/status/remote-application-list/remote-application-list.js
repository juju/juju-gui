/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const StatusTable = require('../table/table');

const maracaPropTypes = require('../../../../maraca/prop-types');
const { normaliseStatus } = require('../../utils');

class StatusRemoteApplicationList extends React.Component {

  /**
    Generate the application rows.
    @returns {Array} The list of rows.
  */
  _generateRows() {
    const {remoteApplications} = this.props;
    return Object.keys(remoteApplications).map(key => {
      const app = remoteApplications[key];
      const urlParts = app.offerURL.split(':');
      return {
        columns: [{
          columnSize: 3,
          content: app.name
        }, {
          columnSize: 3,
          content: app.status.current
        }, {
          columnSize: 3,
          content: urlParts[0]
        }, {
          columnSize: 3,
          content: urlParts[1]
        }],
        extraData: normaliseStatus(app.status.current),
        key: app.offerURL
      };
    });
  }

  render() {
    const headers = [{
      content: 'SAAS',
      columnSize: 3
    }, {
      content: 'Status',
      columnSize: 3
    }, {
      content: 'Store',
      columnSize: 3
    }, {
      content: 'URL',
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

StatusRemoteApplicationList.propTypes = {
  remoteApplications: maracaPropTypes.remoteApplications,
  statusFilter: PropTypes.string
};

module.exports = StatusRemoteApplicationList;

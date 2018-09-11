/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const StatusTable = require('../table/table');

const { normaliseStatus } = require('../../utils');

class StatusRemoteApplicationList extends React.Component {

  /**
    Generate the application rows.
    @returns {Array} The list of rows.
  */
  _generateRows() {
    return this.props.remoteApplications.map(application => {
      // TODO: the passed in applications should be plain objects instead of YUI models.
      const app = application.getAttrs();
      const urlParts = app.url.split(':');
      return {
        columns: [{
          columnSize: 3,
          content: app.service
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
        key: app.url
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
        changeState={this.props.changeState}
        generatePath={this.props.generatePath}
        headers={headers}
        rows={this._generateRows()}
        statusFilter={this.props.statusFilter} />
    );
  }
};

StatusRemoteApplicationList.propTypes = {
  changeState: PropTypes.func.isRequired,
  generatePath: PropTypes.func.isRequired,
  remoteApplications: PropTypes.array.isRequired,
  statusFilter: PropTypes.string
};

module.exports = StatusRemoteApplicationList;

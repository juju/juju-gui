/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const {urls} = require('jaaslib');

const maracaPropTypes = require('../../../../maraca/prop-types');
const StatusLabel = require('../label/label');
const StatusTable = require('../table/table');
const {
  getStatusClass,
  normaliseStatus
} = require('../../utils');

class StatusApplicationList extends React.Component {

  /**
    Generate the application rows.
    @returns {Array} The list of rows.
  */
  _generateRows() {
    const {applications} = this.props;
    return Object.keys(this.props.applications).map(key => {
      const app = applications[key];
      const charm = urls.URL.fromLegacyString(app.charmURL);
      const store = charm.schema === 'cs' ? 'jujucharms' : 'local';
      const revision = charm.revision;
      const charmId = charm.path();
      const units = Object.keys(this.props.units).filter(key =>
        this.props.units[key].application === app.name);
      // Set the revision to null so that it's not included when calling
      // charm.path() below.
      charm.revision = null;
      return {
        classes: [getStatusClass(
          'status-table__row--', app.status.current)],
        onClick: this.props.generateApplicationOnClick(app.name),
        clickURL: this.props.generateApplicationURL(app.name),
        columns: [{
          columnSize: 2,
          content: (
            <span>
              <img className="status-view__icon" src={this.props.getIconPath(app)} />
              {app.name}
            </span>)
        }, {
          columnSize: 2,
          content: app.workloadVersion
        }, {
          columnSize: 2,
          content: app.status.current ? (
            <StatusLabel status={app.status.current} />) : null
        }, {
          columnSize: 1,
          content: units.length
        }, {
          columnSize: 2,
          content: (
            <a
              className="status-view__link"
              href={this.props.generateCharmURL(charmId)}
              onClick={this.props.onCharmClick.bind(this, charmId)}>
              {charm.path()}
            </a>)
        }, {
          columnSize: 2,
          content: store
        }, {
          columnSize: 1,
          content: revision
        }],
        extraData: normaliseStatus(app.status.current),
        key: app.name
      };
    });
  }

  render() {
    const headers = [{
      content: 'Application',
      columnSize: 2
    }, {
      content: 'Version',
      columnSize: 2
    }, {
      content: 'Status',
      columnSize: 2
    }, {
      content: 'Scale',
      columnSize: 1
    }, {
      content: 'Charm',
      columnSize: 2
    }, {
      content: 'Store',
      columnSize: 2
    }, {
      content: 'Rev',
      columnSize: 1
    }];
    return (
      <StatusTable
        headers={headers}
        rows={this._generateRows()}
        statusFilter={this.props.statusFilter} />
    );
  }
};

StatusApplicationList.propTypes = {
  applications: maracaPropTypes.applications,
  generateApplicationOnClick: PropTypes.func.isRequired,
  generateApplicationURL: PropTypes.func.isRequired,
  generateCharmURL: PropTypes.func.isRequired,
  getIconPath: PropTypes.func.isRequired,
  onCharmClick: PropTypes.func.isRequired,
  statusFilter: PropTypes.string,
  units: maracaPropTypes.units
};

module.exports = StatusApplicationList;

/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const BasicTable = require('../../basic-table/basic-table');
const utils = require('../../utils');

class StatusModel extends React.Component {

  /**
    Handle filter changes and store the new status in state.
    @param evt {Object} The change event
  */
  _handleFilterChange(evt) {
    let filter = evt.currentTarget.value;
    if (filter === 'none') {
      filter = null;
    }
    this.props.changeFilter(filter);
  }

  /**
    Generate the filter select box.
    @returns {Object} The select box element to render.
  */
  _generateFilters() {
    const options = ['none'].concat(utils.STATUS_ORDER).map(status => {
      return (
        <option className="status-view__filter-option"
          key={status}
          value={status}>
          {status}
        </option>);
    });
    return (
      <select className="status-view__filter-select"
        onChange={this._handleFilterChange.bind(this)}
        value={this.props.statusFilter || 'none'}>
        {options}
      </select>);
  }

  /**
    Generate the title based on the highest entity status.
    @returns {String} The resulting title.
  */
  _generateTitle() {
    let title = `Everything is ${utils.STATUSES.OK}`;
    switch (this.props.highestStatus) {
      case utils.STATUSES.OK:
        title = `Everything is ${utils.STATUSES.OK}`;
        break;
      case utils.STATUSES.PENDING:
        title = 'Items are pending';
        break;
      case utils.STATUSES.ERROR:
        title = 'Items are in error';
        break;
    }
    return title;
  }

  render() {
    const {counts, highestStatus, model} = this.props;
    return (
      <div>
        <div className="twelve-col no-margin-bottom">
          <div className="eight-col">
            <h2>
              {model.environmentName}
              <span
                className={'status-view__traffic-light ' +
                  `status-view__traffic-light--${highestStatus}`}
                onClick={this.props.changeFilter.bind(this, highestStatus)}
                role="button"
                tabIndex="0"
                title={this._generateTitle()}>
              </span>
            </h2>
          </div>
          <div className="status-view__filter-label two-col">
            Filter status:
          </div>
          <div className="status-view__filter two-col last-col">
            {this._generateFilters()}
          </div>
        </div>
        <BasicTable
          headers={[{
            content: 'Cloud/Region',
            columnSize: 2
          }, {
            content: 'Version',
            columnSize: 2
          }, {
            content: 'SLA',
            columnSize: 1
          }, {
            content: 'Applications',
            columnSize: 2
          }, {
            content: 'Remote applications',
            columnSize: 2
          }, {
            content: 'Units',
            columnSize: 1
          }, {
            content: 'Machines',
            columnSize: 1
          }, {
            content: 'Relations',
            columnSize: 1
          }]}
          rows={[{
            columns: [{
              columnSize: 2,
              content: `${model.cloud}/${model.region}`
            }, {
              columnSize: 2,
              content: model.version
            }, {
              columnSize: 1,
              content: model.sla
            }, {
              columnSize: 2,
              content: counts.applications
            }, {
              columnSize: 2,
              content: counts.remoteApplications
            }, {
              columnSize: 1,
              content: counts.units
            }, {
              columnSize: 1,
              content: counts.machines
            }, {
              columnSize: 1,
              content: counts.relations
            }],
            key: 'model'
          }]} />
      </div>);
  }
};

StatusModel.propTypes = {
  changeFilter: PropTypes.func.isRequired,
  counts: PropTypes.object.isRequired,
  highestStatus: PropTypes.string.isRequired,
  model: PropTypes.object.isRequired,
  statusFilter: PropTypes.string
};

module.exports = StatusModel;

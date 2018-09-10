/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const StatusTable = require('../table/table');

class StatusRelationList extends React.Component {

  /**
    Generate a link to an application from a relation.
    @param name {String} An app name.
    @returns {Object} The link element.
  */
  _generateRelationAppLink(name) {
    const app = this.props.applications.getById(name);
    if (!app) {
      // If the application is not in the DB it must be remote app so don't
      // link to it.
      return (<span>{name}</span>);
    }
    return (
      <a className="status-view__link"
        href={this.props.generateApplicationURL(name)}
        onClick={this.props.onApplicationClick.bind(this, name)}>
        <img className="status-view__icon"
          src={app.get('icon')} />
        {name}
      </a>);
  }

  /**
    Generate the relation rows.
    @returns {Array} The list of rows.
  */
  _generateRows() {
    return this.props.relations.map(relation => {
      const rel = relation.getAttrs();
      let name = '';
      let provides = '';
      let consumes = '';
      let scope = '';
      rel.endpoints.forEach(endpoint => {
        const application = endpoint[0];
        const ep = endpoint[1];
        switch (ep.role) {
          case 'peer':
            name = ep.name;
            provides = application;
            consumes = application;
            scope = 'peer';
            return;
          case 'provider':
            name = ep.name;
            consumes = application;
            scope = 'regular';
            break;
          case 'requirer':
            provides = application;
            break;
        }
      });
      return {
        columns: [{
          columnSize: 3,
          content: name
        }, {
          columnSize: 3,
          content: this._generateRelationAppLink(provides)
        }, {
          columnSize: 3,
          content: this._generateRelationAppLink(consumes)
        }, {
          columnSize: 3,
          content: scope
        }],
        key: rel.id
      };
    });
  }

  render() {
    const headers = [{
      content: 'Relation',
      columnSize: 3
    }, {
      content: 'Provides',
      columnSize: 3
    }, {
      content: 'Consumes',
      columnSize: 3
    }, {
      content: 'Type',
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

StatusRelationList.propTypes = {
  applications: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  generateApplicationURL: PropTypes.func.isRequired,
  generatePath: PropTypes.func.isRequired,
  onApplicationClick: PropTypes.func.isRequired,
  relations: PropTypes.array.isRequired,
  statusFilter: PropTypes.string
};

module.exports = StatusRelationList;

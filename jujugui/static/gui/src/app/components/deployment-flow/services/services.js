/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const BasicTable = require('../../shared/basic-table/basic-table');
const BudgetTable = require('../../budget-table/budget-table');
const changesUtils = require('../../../init/changes-utils');
const DeploymentChangeItem = require('../change-item/change-item');

class DeploymentServices extends React.Component {

  /**
    Generate the list of extra info markup.

    @method _generateExtraInfo
    @param {Object} changes The sorted changes by application.
    @returns {Array} A list of elements by application.
  */
  _generateExtraInfo(changes) {
    const infos = {};
    for (let key in changes) {
      const items = changes[key].map(change => (
        <li key={change.id}>
          <DeploymentChangeItem
            change={change}
            showTime={false} />
        </li>));
      infos[key] = (
        <ul className="deployment-services__changes">
          {items}
        </ul>);
    }
    return infos;
  }

  /**
    Generate spend summary.
    @returns {Object} The spend markup.
  */
  _generateSpend() {
    if (!this.props.withPlans) {
      return null;
    }
    return (
      <div className="deployment-services__spend prepend-seven">
        Maximum monthly spend:&nbsp;
        <span className="deployment-services__max">
          $100
        </span>
      </div>
    );
  }

  /**
    Generate the service changes if there are any.
    @returns {Object} The service changes markup.
  */
  _generateServiceChanges() {
    const currentChangeSet = this.props.getCurrentChangeSet();
    const changes = this.props.changesUtils.sortDescriptionsByApplication(
      currentChangeSet,
      this.props.changesUtils.generateAllChangeDescriptions(currentChangeSet));
    if (!changes || !Object.keys(changes).length) {
      return null;
    }
    return (
      <BudgetTable
        acl={this.props.acl}
        addNotification={this.props.addNotification}
        allocationEditable={true}
        charmsGetById={this.props.charmsGetById}
        extraInfo={this._generateExtraInfo(changes)}
        listPlansForCharm={this.props.listPlansForCharm}
        parseTermId={this.props.parseTermId}
        plansEditable={true}
        services={Object.keys(changes).map(this.props.getServiceByName)}
        showTerms={this.props.showTerms}
        withPlans={this.props.withPlans} />);
  }

  /**
    Generate the machines changes if there are any.
    @returns {Object} The destroyed machines markup.
  */
  _generateMachineChanges() {
    const currentChangeSet = this.props.getCurrentChangeSet();
    const groupedChanges = changesUtils.getGroupedChanges(currentChangeSet);
    const added = groupedChanges._addMachines || {};
    const destroyed = groupedChanges._destroyMachines || {};
    let changes = Object.keys(added).map(key => added[key]);
    changes = changes.concat(Object.keys(destroyed).map(key => destroyed[key]));
    if (!changes.length) {
      return null;
    }
    const machines = changes.map(item => {
      const change = this.props.changesUtils.generateChangeDescription(item);
      return {
        columns: [{
          content: (
            <DeploymentChangeItem
              change={change}
              key={change.id}
              showTime={false} />)
        }],
        key: change.id
      };
    });
    return (
      <div className="v1">
        <BasicTable
          headers={[{
            content: 'Machines'
          }]}
          rows={machines} />
      </div>);
  }

  render() {
    return (
      <div>
        {this._generateServiceChanges()}
        {this._generateSpend()}
        {this._generateMachineChanges()}
      </div>
    );
  }
};

DeploymentServices.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  changesUtils: shapeup.shape({
    generateAllChangeDescriptions: PropTypes.func.isRequired,
    generateChangeDescription: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    sortDescriptionsByApplication: PropTypes.func.isRequired
  }).isRequired,
  charmsGetById: PropTypes.func.isRequired,
  getCurrentChangeSet: PropTypes.func.isRequired,
  getServiceByName: PropTypes.func.isRequired,
  listPlansForCharm: PropTypes.func.isRequired,
  parseTermId: PropTypes.func.isRequired,
  showTerms: PropTypes.func,
  withPlans: PropTypes.bool
};

module.exports = DeploymentServices;

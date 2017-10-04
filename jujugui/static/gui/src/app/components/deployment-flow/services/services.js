/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const BudgetTable = require('../../budget-table/budget-table');
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
        <DeploymentChangeItem
          change={change}
          key={change.id}
          showTime={false} />));
      infos[key] = (
        <ul className="deployment-services__changes">
          {items}
        </ul>);
    }
    return infos;
  }

  /**
    Generate spend summary.

    @method _generateSpend
    @returns {Object} The spend markup.
  */
  _generateSpend() {
    if (!this.props.withPlans) {
      return;
    }
    return (
      <div className="prepend-seven">
        Maximum monthly spend:&nbsp;
        <span className="deployment-services__max">
          $100
        </span>
      </div>
    );
  }

  render() {
    const props = this.props;
    const currentChangeSet = props.getCurrentChangeSet();
    const changes = props.sortDescriptionsByApplication(
      currentChangeSet,
      props.generateAllChangeDescriptions(currentChangeSet));
    return (
      <div>
        <BudgetTable
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          allocationEditable={true}
          charmsGetById={this.props.charmsGetById}
          extraInfo={this._generateExtraInfo(changes)}
          listPlansForCharm={this.props.listPlansForCharm}
          parseTermId={this.props.parseTermId}
          plansEditable={true}
          services={
            Object
              .keys(changes)
              .map(this.props.getServiceByName)}
          showTerms={this.props.showTerms}
          withPlans={this.props.withPlans} />
        {this._generateSpend()}
      </div>
    );
  }
};

DeploymentServices.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  changesFilterByParent: PropTypes.func.isRequired,
  charmsGetById: PropTypes.func.isRequired,
  generateAllChangeDescriptions: PropTypes.func.isRequired,
  getCurrentChangeSet: PropTypes.func.isRequired,
  getServiceByName: PropTypes.func.isRequired,
  listPlansForCharm: PropTypes.func.isRequired,
  parseTermId: PropTypes.func.isRequired,
  showTerms: PropTypes.func,
  sortDescriptionsByApplication: PropTypes.func.isRequired,
  withPlans: PropTypes.bool
};

module.exports = DeploymentServices;

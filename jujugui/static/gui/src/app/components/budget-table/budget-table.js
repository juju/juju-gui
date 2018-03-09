/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const BudgetTableRow = require('./row/row');

class BudgetTable extends React.Component {
  /**
   Generate the list of services.

   @method _generateServices
   @returns {Array} The list of services.
  */
  _generateServices() {
    return this.props.services.map((service, i) => {
      return (
        <BudgetTableRow
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          allocationEditable={this.props.allocationEditable}
          charmsGetById={this.props.charmsGetById}
          extraInfo={
            this.props.extraInfo && this.props.extraInfo[service.get('name')]}
          key={i}
          listPlansForCharm={this.props.listPlansForCharm}
          parseTermId={this.props.parseTermId}
          plansEditable={this.props.plansEditable}
          service={service}
          showTerms={this.props.showTerms}
          withPlans={this.props.withPlans} />);
    });
  }

  /**
    Generate plan headers.

    @method _generatePlanHeaders
    @returns {Object} The plan headers markup.
  */
  _generatePlanHeaders() {
    if (!this.props.withPlans) {
      return;
    }
    const plansEditable = this.props.plansEditable;
    return (
      <div>
        <div className="three-col">
          Details
        </div>
        <div className={plansEditable ? 'one-col' : 'two-col'}>
          Usage
        </div>
        <div className={plansEditable ? 'one-col' : 'two-col'}>
          Allocation
        </div>
        <div className="one-col last-col">
          Spend
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="budget-table twelve-col">
        <div className="budget-table__row-header twelve-col">
          <div className="five-col">
            Name
          </div>
          {this._generatePlanHeaders()}
        </div>
        {this._generateServices()}
      </div>
    );
  }
};

BudgetTable.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  allocationEditable: PropTypes.bool,
  charmsGetById: PropTypes.func,
  extraInfo: PropTypes.object,
  listPlansForCharm: PropTypes.func,
  parseTermId: PropTypes.func,
  plansEditable: PropTypes.bool,
  services: PropTypes.array.isRequired,
  showTerms: PropTypes.func.isRequired,
  withPlans: PropTypes.bool
};

module.exports = BudgetTable;

/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const classNames = require('classnames');

class DeploymentAgreements extends React.Component {
  /**
    Generate select options for the available budgets.

    @method _generateBudgetOptions
  */
  _generateBudgetOptions() {
    var budgets = this.state.budgets;
    if (!budgets) {
      return [];
    }
    return budgets.budgets.map(budget => {
      return {
        label: `${budget.budget} ($${budget.limit})`,
        value: budget.budget
      };
    });
  }

  render() {
    const disabled = this.props.acl.isReadOnly() || this.props.disabled;
    const classes = classNames(
      'deployment-flow-agreements',
      'deployment-flow__deploy-option',
      {
        'deployment-flow__deploy-option--disabled': this.props.disabled
      });
    return (
      <div className={classes}>
        <input className="deployment-flow__deploy-checkbox"
          disabled={disabled}
          id="terms"
          onChange={this.props.onCheckboxChange}
          type="checkbox" />
        <label className="deployment-flow__deploy-label"
          htmlFor="terms">
          I agree to all terms.
        </label>
      </div>
    );
  }
};

DeploymentAgreements.propTypes = {
  acl: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  onCheckboxChange: PropTypes.func.isRequired,
  showTerms: PropTypes.bool,
  terms: PropTypes.array
};

module.exports = DeploymentAgreements;

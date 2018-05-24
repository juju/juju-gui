/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericInput = require('../../generic-input/generic-input');
const GenericButton = require('../../generic-button/generic-button');
const Notification = require('../../notification/notification');

class DeploymentExpertBudget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      budget: null
    };
  }
  /**
    Set the budget value.

    @method _handleBudgetChange
    @param {String} The select value.
  */
  _inputChange(value) {
    this.setState({ budget: value });
  }

  render() {
    const changed = this.state.budget !== this.props.budget;
    return (
      <div className="deployment-expert-budget">
        <Notification
          content={(
            <React.Fragment>
              <strong>Info:</strong>&nbsp;
              We will email you at fake@test.com when you reach
              80% of this limit.
            </React.Fragment>
          )}
          type="info" />
        <div className="deployment-expert-budget__row">
          <span>
            Total estimated monthly cost:
          </span>
          <span className="deployment-expert-budget__cost">
            ${this.props.estimateWithSLA || 0}
          </span>
        </div>
        <div className="deployment-expert-budget__row">
          <span>
            Never charge me more than:
          </span>
          <span className="deployment-expert-budget__budget-input">
            $
            <GenericInput
              disabled={false}
              onChange={this._inputChange.bind(this)}
              value={this.props.budget} />
          </span>
        </div>
        <div className="deployment-expert-budget__row">
          <GenericButton
            action={this.props.setBudget.bind(this, this.state.budget)}
            disabled={!changed}
            type="inline-positive">
            Set budget
          </GenericButton>
        </div>
      </div>
    );
  }
};

DeploymentExpertBudget.propTypes = {
  budget: PropTypes.any,
  estimateWithSLA: PropTypes.any,
  setBudget: PropTypes.func.isRequired
};

module.exports = DeploymentExpertBudget;

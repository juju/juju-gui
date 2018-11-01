/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericInput = require('../../generic-input/generic-input');
const Button = require('../../shared/button/button');

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
    this.setState({budget: value});
  }

  render() {
    const changed = this.state.budget !== this.props.budget;
    return (
      <div className="deployment-expert-budget">
        <div className="deployment-expert-budget__row">
          <span>Total estimated monthly cost:</span>
          <span className="deployment-expert-budget__cost">
            ${this.props.estimateWithSLA || 0}
          </span>
        </div>
        <div className="deployment-expert-budget__row">
          <span>Never charge me more than:</span>
          <span className="deployment-expert-budget__budget-input">
            $
            <GenericInput
              disabled={false}
              onChange={this._inputChange.bind(this)}
              value={this.props.budget}
            />
          </span>
        </div>
        <div className="deployment-expert-budget__row">
          <Button
            action={this.props.setBudget.bind(this, this.state.budget)}
            disabled={!changed}
            type="inline-positive"
          >
            Set budget
          </Button>
        </div>
      </div>
    );
  }
}

DeploymentExpertBudget.propTypes = {
  budget: PropTypes.any,
  estimateWithSLA: PropTypes.any,
  setBudget: PropTypes.func.isRequired
};

module.exports = DeploymentExpertBudget;

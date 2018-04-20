/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const PropTypes = require('prop-types');

const DeploymentSupportSelectionPlan = require('./plan/plan');
const Spinner = require('../../../spinner/spinner');

class DeploymentSupportSelection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedPlan: null,
      slaMachineRates: null
    };
  }

  componentWillMount() {
    this.props.getSLAMachineRates(data => this.setState({slaMachineRates: data}));
  }

  /**
   Generate the list of cards.
   @param plan {String} The plan to set as selected.
  */
  _handlePlanSelect(plan) {
    this.setState({selectedPlan: plan});
  }

  /**
   Generate the list of cards.
   @returns {Array} the list of cards.
  */
  _generateCards() {
    const state = this.state;
    if (!state.slaMachineRates) {
      return (<Spinner />);
    }
    const slaMachineRates = state.slaMachineRates;
    const plans = [{
      cost: '8.75',
      features: ['8hx5d ticked'],
      hourPrice: slaMachineRates.essential,
      name: 'Essential'
    }, {
      cost: '77.00',
      features: [
        '10x5 phone support',
        '2hr critical response'
      ],
      hourPrice: slaMachineRates.standard,
      name: 'Standard'
    }, {
      cost: '154.00',
      features: [
        '24x7 phone support',
        '1hr critical response'
      ],
      hourPrice: slaMachineRates.advanced,
      name: 'Advanced'
    }];
    return plans.map((plan, i) => {
      const classes = [];
      if (i === plans.length - 1) {
        classes.push('last-col');
      }
      return (
        <DeploymentSupportSelectionPlan
          classes={classes}
          cost={plan.cost}
          features={plan.features}
          hourPrice={plan.hourPrice}
          key={plan.name}
          onSelect={this._handlePlanSelect.bind(this, plan.name)}
          selected={plan.name === this.state.selectedPlan}
          title={plan.name} />);
    });
  }

  render() {
    return (
      <div className="deployment-support-selection equal-height">
        {this._generateCards()}
      </div>
    );
  }
};

DeploymentSupportSelection.propTypes = {
  getSLAMachineRates: PropTypes.func.isRequired
};

module.exports = DeploymentSupportSelection;

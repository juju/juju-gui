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
   @param planKey {String} The plan to set as selected.
  */
  _handlePlanSelect(planKey) {
    this.setState({selectedPlan: planKey});
    this.props.setSLA({
      name: planKey,
      hourPrice: this.state.slaMachineRates[planKey]
    });
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
      features: ['8hx5d ticked'],
      hourPrice: slaMachineRates.essential,
      name: 'Essential',
      key: 'essential'
    }, {
      features: [
        '10x5 phone support',
        '2hr critical response'
      ],
      hourPrice: slaMachineRates.standard,
      name: 'Standard',
      key: 'standard'
    }, {
      features: [
        '24x7 phone support',
        '1hr critical response'
      ],
      hourPrice: slaMachineRates.advanced,
      name: 'Advanced',
      key: 'advanced'
    }];
    return plans.map((plan, i) => {
      const classes = [];
      if (i === plans.length - 1) {
        classes.push('last-col');
      }
      return (
        <DeploymentSupportSelectionPlan
          classes={classes}
          features={plan.features}
          hourPrice={plan.hourPrice}
          key={plan.name}
          machineCount={parseInt(this.props.machineCount, 10)}
          onSelect={this._handlePlanSelect.bind(this, plan.key)}
          selected={plan.name.toLowerCase() === this.state.selectedPlan}
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
  getSLAMachineRates: PropTypes.func.isRequired,
  machineCount: PropTypes.string.isRequired,
  setSLA: PropTypes.func.isRequired
};

module.exports = DeploymentSupportSelection;

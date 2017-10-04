/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class InspectorPlan extends React.Component {
  /**
    Generates the elements if the applicaton has a plan selected.

    @method _generatePlanDetails
    @return {Function} The React elements for the UI.
  */
  _generatePlanDetails() {
    var currentPlan = this.props.currentPlan;
    return (
      <div className="inspector-plan__details">
        <div className="inspector-plan__title">{currentPlan.url}</div>
        <div className="inspector-plan__price">{currentPlan.price}</div>
        <div className="inspector-plan__description">
          {currentPlan.description}
        </div>
      </div>);
  }

  /**
    Generates the elements if the application does not have a plan selected.

    @method _generateNoPlans
    @return {Function} The React elements for the UI.
  */
  _generateNoPlans() {
    return (
      <div className="inspector-plan__no-plan">
        You have no active plan
      </div>);
  }

  render() {
    return (
      <div className="inspector-plan">
        {this.props.currentPlan ?
          this._generatePlanDetails() : this._generateNoPlans()}
      </div>
    );
  }
};

InspectorPlan.propTypes = {
  acl: PropTypes.object.isRequired,
  currentPlan: PropTypes.object
};

module.exports = InspectorPlan;

'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../../../../svg-icon/svg-icon');

class DeploymentSupportSelectionPlan extends React.Component {

  _generateFeatures() {
    const features = this.props.features.map((feature, i) => (
      <li className="deployment-support-select-plan__feature"
        key={feature + i}>
        <SvgIcon
          name="bullet"
          size="14" />
        {feature}
      </li>
    ));
    return (
      <ul className="deployment-support-select-plan__features">
        {features}
      </ul>);
  }

  _calculateCost() {
    // 720 is the average number of hours in a month.
    return (this.props.machineCount * parseFloat(this.props.hourPrice) * 720).toFixed(2);
  }

  render() {
    const classes = classNames(
      'deployment-support-select-plan',
      'four-col',
      this.props.classes,
      {
        'deployment-support-select-plan--selected': this.props.selected
      });
    return (
      <div className={classes}>
        <div className="deployment-support-select-plan__card"
          onClick={this.props.onSelect}
          role="button"
          tabIndex="0">
          <h3>{this.props.title}</h3>
          {this._generateFeatures()}
          <div className="deployment-support-select-plan__price">
            Monthly cost
            <span className="deployment-support-select-plan__price-number">
              ${this._calculateCost()}
            </span>
          </div>
        </div>
        <div className="deployment-support-select-plan__hour-price">
          ${this.props.hourPrice} per machine-hour
        </div>
      </div>
    );
  }
};


DeploymentSupportSelectionPlan.propTypes = {
  classes: PropTypes.array,
  features: PropTypes.array.isRequired,
  hourPrice: PropTypes.string.isRequired,
  machineCount: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired
};

module.exports = DeploymentSupportSelectionPlan;

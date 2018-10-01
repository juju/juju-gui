/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const Button = require('../../shared/button/button');
const TermsPopup = require('../../terms-popup/terms-popup');
/**
  A component for the user to agree to terms in the deployment flow.
*/
class DeploymentAgreements extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showTerms: false
    };
  }

  /**
   Toggle the terms state.
  */
  _toggleTerms() {
    this.setState({showTerms: !this.state.showTerms});
  }

  /**
  Generate the terms the user needs to agree to.
  @returns {Object} The terms markup.
  */
  _generateTerms() {
    if (!this.state.showTerms) {
      return null;
    }
    return (
      <TermsPopup
        close={this._toggleTerms.bind(this)}
        terms={this.props.terms} />);
  }

  /**
    Generate the terms link.
    @returns {Object} The terms link markup.
  */
  _generateTermsLink() {
    if (!this.props.showTerms) {
      return null;
    }
    const terms = this.props.terms;
    if (terms && terms.length) {
      return (
        <Button
          action={this._toggleTerms.bind(this)}
          type="inline-base">
          View terms
        </Button>);
    }
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
        <input
          className="deployment-flow__deploy-checkbox"
          disabled={disabled}
          id="terms"
          onChange={this.props.onCheckboxChange}
          type="checkbox" />
        <label
          className="deployment-flow__deploy-label"
          htmlFor="terms">
          I agree to all terms.
          {this._generateTermsLink()}
        </label>
        {this._generateTerms()}
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

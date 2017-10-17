/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../../button-row/button-row');
const SvgIcon = require('../../svg-icon/svg-icon');

class DeploymentSection extends React.Component {
  /**
    Generate the actions.

    @method _generateCheck
    @returns {Object} The actions markup.
  */
  _generateActions() {
    if (!this.props.buttons && !this.props.extra) {
      return;
    }
    return (
      <div className="deployment-section__actions">
        {this._generateExtra()}
        {this._generateButtons()}
      </div>);
  }

  /**
    Generate the buttons.

    @method _generateButtons
    @returns {Object} The buttons component.
  */
  _generateButtons() {
    var buttons = this.props.buttons;
    if (!buttons) {
      return;
    }
    return (
      <ButtonRow
        buttons={this.props.buttons} />);
  }

  /**
    Generate the extra info.

    @method _generateExtra
    @returns {Object} The actions markup.
  */
  _generateExtra() {
    var extra = this.props.extra;
    if (!extra) {
      return;
    }
    return (
      <div className="deployment-section__extra">
        {extra}
      </div>);
  }

  /**
    Generate the check icon if it should be displayed.

    @method _generateCheck
    @returns {Object} The check markup.
  */
  _generateCheck() {
    if (!this.props.showCheck) {
      return;
    }
    return (
      <SvgIcon
        className="deployment-section__title-checkmark"
        name="complete"
        size="24" />);
  }

  render() {
    var instance = this.props.instance;
    var extra = {
      'deployment-section--active': !this.props.disabled,
      'deployment-section--completed': this.props.completed
    };
    extra[instance] = !!instance;
    var classes = classNames(
      'deployment-section',
      'twelve-col',
      extra);
    return (
      <div className={classes}>
        <div className="inner-wrapper">
          <div className="twelve-col deployment-section__content">
            {this._generateActions()}
            <h3 className="deployment-section__title">
              {this._generateCheck()}
              {this.props.title}
            </h3>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
};

DeploymentSection.propTypes = {
  buttons: PropTypes.array,
  children: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object
  ]),
  completed: PropTypes.bool,
  disabled: PropTypes.bool,
  extra: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
    PropTypes.string
  ]),
  instance: PropTypes.string,
  showCheck: PropTypes.bool,
  title: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
    PropTypes.string
  ])
};

module.exports = DeploymentSection;

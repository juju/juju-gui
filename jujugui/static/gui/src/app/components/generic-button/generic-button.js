/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class GenericButton extends React.Component {
  /**
    Returns the classes for the button based on the provided props.
    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    return classNames(
      this.props.type ? 'button--' + this.props.type : 'button--neutral',
      {
        'button--disabled': this.props.disabled
      },
      this.props.extraClasses
    );
  }

  /**
    Call the action if not disabled.

    @method _handleClick
    @param {Object} e The click event.
  */
  _handleClick(e) {
    // Don't bubble the click the parent.
    e.stopPropagation();
    // If submit is true then typically no action is provided because it
    // is submitting a form.
    if (!this.props.disabled && this.props.action) {
      this.props.action();
    }
    if (this.props.disabled && this.props.submit) {
      e.preventDefault();
    }
  }

  render() {
    return (
      <button className={this._generateClasses()}
        onClick={this._handleClick.bind(this)}
        title={this.props.tooltip}
        type={this.props.submit ? 'submit' : 'button'}>
        {this.props.children}
      </button>
    );
  }
};

GenericButton.propTypes = {
  action: PropTypes.func,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  extraClasses: PropTypes.string,
  submit: PropTypes.bool,
  tooltip: PropTypes.string,
  type: PropTypes.string
};

module.exports = GenericButton;

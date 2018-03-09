/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../generic-button/generic-button');

class ButtonRow extends React.Component {
  /**
    Returns the classes for the footer based on the provided props.
    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    var classes = {};
    var buttonsLength = this.props.buttons.length;
    classes['button-row--multiple'] = buttonsLength > 0;
    classes['button-row--count-' + buttonsLength] = true;
    return classNames(
      'button-row',
      classes
    );
  }

  /**
    Creates the buttons based on the provided props.
    @method _generateButtons
    @param {Array} buttons The properties of the buttons to generate.
    @returns {Array} Collection of buttons.
  */
  _generateButtons(buttons) {
    var components = [];
    buttons.forEach(button => {
      components.push(
        <GenericButton
          action={button.action}
          disabled={button.disabled}
          key={button.title}
          submit={button.submit}
          type={button.type}>
          {button.title}
        </GenericButton>);
    });
    return components;
  }

  render() {
    var buttons = this._generateButtons(this.props.buttons);
    return (
      <div className={this._generateClasses()}>
        {buttons}
      </div>
    );
  }
};

ButtonRow.propTypes = {
  buttons: PropTypes.array.isRequired
};

module.exports = ButtonRow;

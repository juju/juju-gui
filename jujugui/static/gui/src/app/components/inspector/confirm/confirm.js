/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../../button-row/button-row');

class InspectorConfirm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: this.props.open
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({open: nextProps.open});
  }

  /**
    Returns the classes for the confirmation based on the provided props.
    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    return classNames(
      'inspector-confirm',
      this.props.open ? 'inspector-confirm--open' : ''
    );
  }

  /**
    Returns the classes for the message which will be hidden if there is
    no message.
    @method _messageClasses
    @returns {String} The collection of class names.
  */
  _messageClasses() {
    return classNames(
      'inspector-confirm__message',
      {
        hidden: !this.props.message
      }
    );
  }

  render() {
    // If there are no buttons, don't render a button row, which may have
    // CSS styles (e.g., min-height) that don't fly with an empty button
    // row.
    const buttons = this.props.buttons;
    let buttonRow;
    if (buttons && buttons.length > 0) {
      buttonRow = (
        <ButtonRow
          buttons={this.props.buttons} />
      );
    }
    return (
      <div className={this._generateClasses()}>
        <p className={this._messageClasses()}>
          {this.props.message}
        </p>
        {buttonRow}
      </div>
    );
  }
};

InspectorConfirm.propTypes = {
  buttons: PropTypes.array.isRequired,
  message: PropTypes.string,
  open: PropTypes.bool
};

module.exports = InspectorConfirm;

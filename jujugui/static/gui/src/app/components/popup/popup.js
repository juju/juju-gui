/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../button-row/button-row');
const GenericButton = require('../generic-button/generic-button');
const Panel = require('../panel/panel');
const SvgIcon = require('../svg-icon/svg-icon');

/**
  Popup provides a React component for modal confirmation of an
  action.
*/
class Popup extends React.Component {
  /**
   Generate the buttons component if required.

   @method _generateButtons
  */
  _generateButtons() {
    const buttons = this.props.buttons;
    if (buttons) {
      return (
        <ButtonRow
          buttons={buttons} />);
    }
  }

  /**
   Generate the close component if required.

   @method _generateClose
  */
  _generateClose() {
    const close = this.props.close;
    if (close) {
      return (
        <div className="popup__close">
          <GenericButton
            action={close}
            type="base">
            <SvgIcon
              name="close_16"
              size="16" />
          </GenericButton>
        </div>);
    }
  }

  /**
   Generate the title if required.

   @method _generateTitle
  */
  _generateTitle() {
    const title = this.props.title;
    if (title) {
      return (
        <h3 className="popup__title">
          {title}
        </h3>);
    }
  }

  /**
    Generate the classes based on the props.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    return classNames(
      'popup__panel',
      `popup__panel--${this.props.type}`,
      this.props.className
    );
  }

  render() {
    return (
      <Panel
        instanceName="popup"
        visible={true}>
        <div className={this._generateClasses()}>
          {this._generateClose()}
          {this._generateTitle()}
          {this.props.children}
          {this._generateButtons()}
        </div>
      </Panel>
    );
  }
};

Popup.propTypes = {
  buttons: PropTypes.array,
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  className: PropTypes.string,
  close: PropTypes.func,
  title: PropTypes.string,
  type: PropTypes.string
};

Popup.defaultProps = {
  type: 'narrow',
  className: ''
};

module.exports = Popup;

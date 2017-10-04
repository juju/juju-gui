/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');
/**
  Renders a new vanilla style notification
  (https://docs.vanillaframework.io/en/patterns/notification). Can be
  dismissed if a 'dismiss' function is passed, otherwise just displays
  'content' in the desired style.
*/
class Notification extends React.Component {
  /**
    Generate classes based on 'type' and extra classes.

    @return {string} The class string.
  */
  _generateClasses() {
    let classes = 'p-notification';
    if (this.props.type) {
      classes = `${classes}--${this.props.type}`;
    }
    if (this.props.extraClasses) {
      classes = `${classes} ${this.props.extraClasses}`;
    }
    return classes;
  }

  /**
    Dismiss the notification.

    @param evt {Object} The click event.
  */
  _dismiss(evt) {
    evt.stopPropagation();
    const dismiss = this.props.dismiss;
    dismiss && dismiss();
  }

  /**
    Generates the dismiss button if a dismiss function is provided.
    The parent is tasked with calling the correct dismiss functionality as
    it will be on a per use basis.

    @return {object} React Button node.
  */
  _generateDismiss() {
    if (!this.props.dismiss) {
      return;
    }
    return (
      <button
        className="p-notification__action"
        onClick={this._dismiss.bind(this)}>
        <SvgIcon
          name="close_16" size="16" />
      </button>);
  }

  render() {
    const content = (<div className={this._generateClasses()}>
      <p className="p-notification__response">
        {this.props.content}
        {this._generateDismiss()}
      </p>
    </div>);
    if (this.props.isBlocking && this.props.dismiss) {
      return (
        <div className="p-notification__blocker" onClick={this.props.dismiss}>
          {content}
        </div>
      );
    } else if (this.props.isBlocking) {
      return (
        <div className="p-notification__blocker">
          {content}
        </div>
      );
    }
    return content;
  }
};

Notification.propTypes = {
  content: PropTypes.object.isRequired,
  dismiss: PropTypes.func,
  extraClasses: PropTypes.string,
  isBlocking: PropTypes.bool,
  // Types: positive, caution, negative
  type: PropTypes.string
};

module.exports = Notification;

/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../../svg-icon/svg-icon');

class NotificationListItem extends React.Component {
  constructor() {
    super();
    this.state = {
      visible: true
    };
  }

  /**
    Generates the container classes based on the message type and visisible
    state.

    @method _generateClasses
  */
  _generateClasses() {
    var type = this.props.type || 'info';
    var visible = this.state.visible;
    return classNames(
      'notification-list-item',
      'notification-list-item--' + type,
      {
        'notification-list-item--visible': visible,
        'notification-list-item--hidden': !visible
      });
  }

  /**
    Hides this component and remove it from its parent. The parent will
    auto remove non error components after a duration.

    @method hide
  */
  hide() {
    this.setState({visible: false});
    setTimeout(() => {
      // Wait before telling the parent to clean up so that the animation
      // has time to complete. Note that the default timeout is closely tied
      // to animation timings set in the notification CSS, so don't change one
      // without changing the other.
      this.props.removeNotification(this.props.timestamp);
    }, this.props.timeout || 750);
  }

  render() {
    return (
      <li className={this._generateClasses()}>
        <span>{this.props.message}</span>
        <span className="notification-list-item__hide" onClick={this.hide.bind(this)}
          role="button"
          tabIndex="0">
          <SvgIcon name="close_16"
            size="16" />
        </span>
      </li>);
  }
};

NotificationListItem.propTypes = {
  message: PropTypes.node,
  removeNotification: PropTypes.func.isRequired,
  timeout: PropTypes.number,
  timestamp: PropTypes.string.isRequired,
  type: PropTypes.string
};

module.exports = NotificationListItem;

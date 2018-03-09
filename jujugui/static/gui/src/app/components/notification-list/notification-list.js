/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const NotificationListItem = require('./item/item');

class NotificationList extends React.Component {
  constructor(props) {
    super(props);
    const notifications = {};
    const note = this.props.notification;
    if (note) {
      notifications[note.timestamp] = this._processNotification(note);
    }
    this.timeouts = [];
    this.state = {
      notifications: notifications
    };
  }

  /**
    This simply maps the notification values to a simple object to avoid
    passing around all of the extra cruft in the YUI model. This can be
    removed when we update the model system.

    @method _processNotification
    @param {Object} notification The notification to show.
  */
  _processNotification(notification) {
    const structured = {
      message: notification.message,
      type: notification.level,
      timestamp: notification.timestamp
    };

    // Emiting a google tag manager event registering the notification.
    if (window.dataLayer) {
      window.dataLayer.push({
        'event': 'GAEvent',
        'eventCategory': 'Notification',
        'eventAction': notification.level,
        'eventLabel': notification.message,
        'eventValue': undefined
      });
    }

    return structured;
  }

  componentWillReceiveProps(nextProps) {
    // This component will be re-rendered every time a notification is Added
    // so we only need to add the notification into state.
    const notification = nextProps.notification;
    if (!notification) {
      return;
    }
    const notifications = this.state.notifications;
    notifications[notification.timestamp] =
      this._processNotification(notification);
    this.setState({notifications: notifications});
  }

  _startTimeout(key, notification) {
    if (notification.type !== 'error') {
      // If it's not an error message then it needs to auto destroy.
      this.timeouts.push(setTimeout(() => {
        const item = this.refs['NotificationListItem' + key];
        if (item) {
          item.hide();
        }
      }, this.props.timeout || 3000));
    }
  }

  _generateNotifications() {
    const notifications = this.state.notifications;
    const elements = [];
    Object.keys(notifications).forEach(key => {
      const notification = notifications[key];
      this._startTimeout(key, notification);
      elements.push(
        <NotificationListItem
          key={key}
          message={notification.message}
          ref={'NotificationListItem' + key}
          removeNotification={this._removeNotification.bind(this)}
          timeout={this.props.timeout}
          timestamp={key}
          type={notification.type} />);
    });
    return elements;
  }

  _removeNotification(timestamp) {
    const notifications = this.state.notifications;
    delete notifications[timestamp];
    this.setState({notifications: notifications});
  }

  _clearTimeouts() {
    this.timeouts.forEach(id => {
      clearTimeout(id);
    });
    this.timeouts = [];
  }

  _restartTimeouts() {
    // Only restart if there are no timeouts active.
    if (this.timeouts.length > 0) {
      return;
    }
    const notifications = this.state.notifications;
    Object.keys(notifications).forEach(key => {
      this._startTimeout(key, notifications[key]);
    });
  }

  render() {
    return (
      <ul className="notification-list"
        onMouseOut={this._restartTimeouts.bind(this)}
        onMouseOver={this._clearTimeouts.bind(this)}>
        {this._generateNotifications()}
      </ul>);
  }
};

NotificationList.propTypes = {
  // This cannot be required because on initial render if you pass in
  // undefined or null for a notification it throws an error
  // https://github.com/facebook/react/issues/3163
  notification: PropTypes.object,
  timeout: PropTypes.number
};

module.exports = NotificationList;

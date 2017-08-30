/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

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
          timestamp={key}
          ref={'NotificationListItem' + key}
          removeNotification={this._removeNotification.bind(this)}
          message={notification.message}
          timeout={this.props.timeout}
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
      <ul onMouseOver={this._clearTimeouts.bind(this)}
        onMouseOut={this._restartTimeouts.bind(this)}
        className="notification-list">
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

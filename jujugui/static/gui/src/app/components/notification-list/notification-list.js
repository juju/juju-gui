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

YUI.add('notification-list', function() {

  juju.components.NotificationList = React.createClass({

    propTypes: {
      // This cannot be required because on initial render if you pass in
      // undefined or null for a notification it throws an error
      // https://github.com/facebook/react/issues/3163
      notification: React.PropTypes.object,
      timeout: React.PropTypes.number
    },

    getInitialState: function() {
      var notifications = {};
      var note = this.props.notification;
      if (note) {
        notifications[note.timestamp] = this._processNotification(note);
      }
      this.timeouts = [];
      return {
        notifications: notifications
      };
    },

    /**
      This simply maps the notification values to a simple object to avoid
      passing around all of the extra cruft in the YUI model. This can be
      removed when we update the model system.

      @method _processNotification
      @param {Object} notification The notification to show.
    */
    _processNotification: function(notification) {
      var structured = {
        message: notification.message,
        type: notification.level,
        timestamp: notification.timestamp
      };
      return structured;
    },

    componentWillReceiveProps: function(nextProps) {
      // This component will be re-rendered every time a notification is Added
      // so we only need to add the notification into state.
      var notification = nextProps.notification;
      if (!notification) {
        return;
      }
      var notifications = this.state.notifications;
      notifications[notification.timestamp] =
        this._processNotification(notification);
      this.setState({notifications: notifications});
    },

    _startTimeout: function(key, notification) {
      if (notification.type !== 'error') {
        // If it's not an error message then it needs to auto destroy.
        this.timeouts.push(setTimeout(() => {
          var item = this.refs['NotificationListItem' + key];
          if (item) {
            item.hide();
          }
        }, this.props.timeout || 3000));
      }
    },

    _generateNotifications: function() {
      var notifications = this.state.notifications;
      var elements = [];
      Object.keys(notifications).forEach(key => {
        const notification = notifications[key];
        this._startTimeout(key, notification);
        elements.push(
          <juju.components.NotificationListItem
            key={key}
            timestamp={key}
            ref={'NotificationListItem' + key}
            removeNotification={this._removeNotification}
            message={notification.message}
            timeout={this.props.timeout}
            type={notification.type} />);
      });
      return elements;
    },

    _removeNotification: function(timestamp) {
      var notifications = this.state.notifications;
      delete notifications[timestamp];
      this.setState({notifications: notifications});
    },

    _clearTimeouts: function() {
      this.timeouts.forEach(id => {
        clearTimeout(id);
      });
      this.timeouts = [];
    },

    _restartTimeouts: function() {
      // Only restart if there are no timeouts active.
      if (this.timeouts.length > 0) {
        return;
      }
      const notifications = this.state.notifications;
      Object.keys(notifications).forEach(key => {
        this._startTimeout(key, notifications[key]);
      });
    },

    render: function() {
      return (
        <ul onMouseOver={this._clearTimeouts}
            onMouseOut={this._restartTimeouts}
            className="notification-list">
          {this._generateNotifications()}
        </ul>);
    }

  });

}, '0.1.0', {
  requires: [
    'notification-list-item'
  ]
});

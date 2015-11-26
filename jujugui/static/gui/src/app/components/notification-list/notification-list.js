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
      var n = this.props.notification;
      if (n) {
        notifications[n.timestamp] = this._processNotification(n);
      }
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
        type: notification.level
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

    _generateNotifications: function() {
      var notifications = this.state.notifications;
      var elements = [];
      Object.keys(notifications).forEach((key) => {
        var type = notifications[key].type;
        elements.push(
          <juju.components.NotificationListItem
            key={key}
            timestamp={key}
            ref={'NotificationListItem' + key}
            removeNotification={this._removeNotification}
            message={notifications[key].message}
            timeout={this.props.timeout}
            type={type} />);
        if (type !== 'error') {
          // If it's not an error message then it needs to auto destroy.
          setTimeout(() => {
            var item = this.refs['NotificationListItem' + key];
            if (item) {
              this.refs['NotificationListItem' + key].hide();
            }
          }, this.props.timeout || 3000);
        }
      });
      return elements;
    },

    _removeNotification: function(timestamp) {
      var notifications = this.state.notifications;
      delete notifications[timestamp];
      this.setState({notifications: notifications});
    },

    render: function() {
      return (
        <div className="notification-list">
          <ul>
            {this._generateNotifications()}
          </ul>
        </div>);
    }

  });

}, '0.1.0', {
  requires: [
    'notification-list-item'
  ]
});

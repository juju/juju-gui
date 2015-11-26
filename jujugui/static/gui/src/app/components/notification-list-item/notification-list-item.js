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

YUI.add('notification-list-item', function() {

  juju.components.NotificationListItem = React.createClass({

    propTypes: {
      content: React.PropTypes.string.isRequired,
      type: React.PropTypes.string
    },

    getInitialState: function() {
      return {
        visible: true
      };
    },

    /**
      Generates the container classes based on the message type and visisible
      state.

      @method generateClasses
    */
    generateClasses: function() {
      var type = this.props.type || 'info';
      var visible = this.state.visible;
      return classNames(
        'notification-list-item',
        'notification-list-item--' + type,
        {
          'notification-list-item--visible': visible,
          'notification-list-item--hidden': !visible
        });
    },

    /**
      Hides this component and remove it from its parent. The parent will
      auto remove non error components after a duration.

      @method hide
    */
    hide: function() {
      this.setState({visible: false});
      setTimeout(() => {
        // Wait 0.5s before telling the parent to clean up so that the animation
        // has time to complete.
        this.props.removeNotification(this.props.timestamp);
      }, 500);
    },

    render: function() {
      return (
        <li className={this.generateClasses()} onClick={this.hide}>
          <span>{this.props.content}</span>
          <span tabIndex="0" role="button"
            className="notification-list-item__hide">
            <juju.components.SvgIcon name="close_16"
              size="16" />
          </span>
        </li>);
    }

  });

}, '0.1.0', {
  requires: []
});

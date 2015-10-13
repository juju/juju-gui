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

YUI.add('deployment-bar-notification', function() {

  juju.components.DeploymentBarNotification = React.createClass({
    timeout: null,

    /**
      Fade out the notification.

      @method _hideNotification
    */
    _hideNotification: function() {
      var node;
      try {
        node = React.findDOMNode(this);
      } catch (e) {
        // The notification has already been removed.
      }
      // Fade out the notification.
      if (node) {
        node.classList.remove('deployment-bar__notification--visible');
      }
    },

    componentDidMount: function() {
      this._showNotification(null);
    },

    componentDidUpdate: function(prevProps, prevState) {
      this._showNotification(prevProps);
    },

    /**
      Show the notification with the supplied change.

      @method _showNotification
      @param {Object} prevProps The previous props for the component.
    */
    _showNotification: function(prevProps) {
      if (this.props.change) {
        var newId = this.props.change.id;
        var oldId = prevProps && prevProps.change ? prevProps.change.id : null;
        // Only show the notification if we've received a new id.
        if (newId !== oldId) {
          var node = React.findDOMNode(this);
          // Fade in the notification.
          if (node) {
            node.classList.add('deployment-bar__notification--visible');
            window.clearTimeout(this.timeout);
            this.timeout = window.setTimeout(this._hideNotification, 4000);
          }
        }
      }
    },

    /**
      Hide the notification when clicked

      @method _handleClick
    */
    _handleClick: function() {
      window.clearTimeout(this.timeout);
      this._hideNotification();
    },

    render: function() {
      var description;
      if (this.props.change) {
        description = this.props.change.description;
      }
      return (
          <div className="deployment-bar__notification"
            onClick={this._handleClick}>
            {description}
          </div>
      );
    }
  });

}, '0.1.0', { requires: []});

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

YUI.add('demo-notification', function() {

  juju.components.DemoNotification = React.createClass({
    propTypes: {
      sandboxMode: React.PropTypes.bool.isRequired
    },

    /**
      Get the current state of the demo notification.

      @method getInitialState
      @returns {Object} The current state.
    */
    getInitialState: function() {
      return {
        sandboxMode: null
      };
    },

    render: function() {
      if (this.props.sandboxMode) {
        return (
          <div className="demo-notification">
            <a className="demo-notification__button"
              href="https://jujucharms.com/get-started"
              target="_blank" >
              <span className="demo-notification__button-external">
                Get started
              </span>
            </a>
            <p className="demo-notification__text">
              This is a&nbsp;
              <span className="demo-notification__highlight">demo</span>&nbsp;
              version of Juju. Model your application using the canvas and&nbsp;
              deploy it to any cloud.
            </p>
          </div>
        );
      } else {
        return '';
      }
    }
  });

}, '0.1.0', { requires: []});

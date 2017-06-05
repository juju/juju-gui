/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

YUI.add('cookie-notification', function() {
  /**
    CookieNotification provides a React component for displaying cookie
    acceptance notification.
  */
  juju.components.CookieNotification = React.createClass({
    displayName: 'CookieNotification',

    propTypes: {
      close: React.PropTypes.func.isRequired
    },

    render: function() {
      return (
        <div className="cookie-notification">
          <div className="cookie-notification__wrapper">
            <span className="cookie-notification__close"
              onClick={this.props.close}
              role="button"
              tabIndex={0}>
              <juju.components.SvgIcon
                name="close_16"
                size="16" />
            </span>
            <p className="cookie-notification__message">
              We use cookies to improve your experience. By your continued use
              of this application you accept such use. To change your settings
              please&nbsp;
              <a href="http://www.ubuntu.com/privacy-policy#cookies">
                see our policy
              </a>
            </p>
          </div>
        </div>
      );
    }

  });

}, '', {
  requires: [
    'svg-icon'
  ]
});

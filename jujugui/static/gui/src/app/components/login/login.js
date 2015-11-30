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

YUI.add('login-component', function() {

  juju.components.Login = React.createClass({

    propTypes: {
      setCredentials: React.PropTypes.func.isRequired,
      login: React.PropTypes.func.isRequired
    },

    _handleSubmit: function(e) {
      e.preventDefault();
      var props = this.props;
      props.setCredentials({
        user: this.refs.username.value,
        password: this.refs.password.value
      });
      props.login();
    },

    render: function() {
      return (
        <div className="login">
          <form
            ref="form"
            onSubmit={this._handleSubmit}>
            <input type="text" name="username" ref="username"/>
            <input type="password" name="password" ref="password"/>
            <input type="submit"/>
          </form>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: []
});

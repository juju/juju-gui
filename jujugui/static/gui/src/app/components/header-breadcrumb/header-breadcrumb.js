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

YUI.add('header-breadcrumb', function() {

  juju.components.HeaderBreadcrumb = React.createClass({
    propTypes: {
      app: React.PropTypes.object.isRequired,
      env: React.PropTypes.object,
      envName: React.PropTypes.string.isRequired,
      dbEnvironmentSet: React.PropTypes.func.isRequired,
      jem: React.PropTypes.object,
      envList: React.PropTypes.array,
      changeState: React.PropTypes.func.isRequired,
      showConnectingMask: React.PropTypes.func.isRequired,
      authDetails: React.PropTypes.object,
      showEnvSwitcher: React.PropTypes.bool.isRequired,
      userName: React.PropTypes.string
    },

    /**
      Renders the markup for the Env Switcher if the showEnvSwitcher prop is
      truthy.

      @method _renderEnvSwitcher
    */
    _renderEnvSwitcher: function() {
      if (this.props.showEnvSwitcher) {
        return (
          <li className="header-breadcrumb__list-item">
            <window.juju.components.EnvSwitcher
              app={this.props.app}
              env={this.props.env}
              environmentName={this.props.envName}
              dbEnvironmentSet={this.props.dbEnvironmentSet}
              jem={this.props.jem}
              envList={this.props.envList}
              changeState={this.props.changeState}
              showConnectingMask={this.props.showConnectingMask}
              authDetails={this.props.authDetails} />
          </li>);
      }
      return;
    },

    render: function() {
      var auth = this.props.authDetails;
      return (
        <ul className="header-breadcrumb">
          <li className="header-breadcrumb__list-item"></li>
          <li className="header-breadcrumb__list-item">
            <a className="header-breadcrumb--link" href="/profile/">
              {auth && auth.user && auth.user.name || 'anonymous'}
            </a>
          </li>
          {this._renderEnvSwitcher()}
        </ul>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'env-switcher'
  ]
});

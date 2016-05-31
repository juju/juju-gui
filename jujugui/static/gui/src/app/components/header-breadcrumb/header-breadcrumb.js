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
      envName: React.PropTypes.string.isRequired,
      envList: React.PropTypes.array,
      changeState: React.PropTypes.func.isRequired,
      getAppState: React.PropTypes.func.isRequired,
      authDetails: React.PropTypes.object,
      listModels: React.PropTypes.func.isRequired,
      showEnvSwitcher: React.PropTypes.bool.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      userName: React.PropTypes.string
    },

    /**
      Renders the markup for the Env Switcher if the showEnvSwitcher prop is
      truthy.

      @method _renderEnvSwitcher
    */
    _renderEnvSwitcher: function() {
      var component = this.props.getAppState(
        'current', 'sectionB', 'component');
      if (this.props.showEnvSwitcher && component !== 'profile') {
        return (
          <li className="header-breadcrumb__list-item">
            <window.juju.components.EnvSwitcher
              environmentName={this.props.envName}
              envList={this.props.envList}
              changeState={this.props.changeState}
              listModels={this.props.listModels}
              switchModel={this.props.switchModel}
              authDetails={this.props.authDetails} />
          </li>);
      }
      return;
    },

    /**
      Handles clicks on the profile link.

      @method _handleProfileClick
    */
    _handleProfileClick: function(e) {
      e.preventDefault();
      this.props.changeState({
        sectionB: {
          component: 'profile',
          metadata: null
        }
      });
    },

    render: function() {
      var auth = this.props.authDetails;
      var userItem;
      if (auth && (auth.user || auth.loading)) {
        var username = auth.loading ? '...' : auth.usernameDisplay;
        userItem = (
          <li className="header-breadcrumb__list-item">
            <a className="header-breadcrumb--link"
               onClick={this._handleProfileClick}>
              {username}
            </a>
          </li>
        );
      }
      return (
        <ul className="header-breadcrumb">
          {userItem}
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

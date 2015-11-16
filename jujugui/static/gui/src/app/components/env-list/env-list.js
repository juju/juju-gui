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

YUI.add('env-list', function() {

  juju.components.EnvList = React.createClass({

    propTypes: {
      envs: React.PropTypes.array,
      handleEnvClick: React.PropTypes.func,
      createNewEnv: React.PropTypes.func
    },

    getInitialState: function() {
      return {
        envs: this.props.envs,
        envName: '',
      };
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState({envs: nextProps.envs});
    },

    generateEnvList: function() {
      var envs = [];
      this.state.envs.forEach(function(env) {
        // below the env.name is for JES response object and env.path is for
        // the JEM response object.
        var envName = env.name || env.path;
        envs.push(
          <li className="env-list__environment"
            data-id={env.uuid}
            onClick={this.props.handleEnvClick}
            key={env.uuid}>
            {envName}
          </li>);
      }, this);
      return envs;
    },

    /**
      Environment name input change handler. Sets the envName state value
      with the value of the input.

      @method envNameChange
      @param {Object} e The change event.
    */
    envNameChange: function(e) {
      this.setState({envName: e.target.value});
    },

    /**
      Calls the createNewEnv prop passing it the current envName state value.

      @method createNewEnv
    */
    createNewEnv: function() {
      this.props.createNewEnv(this.state.envName);
    },

    /**
      Calls the showUserProfile prop.

      @method showProfile
    */
    showProfile: function() {
      this.props.showUserProfile();
    },

    render: function() {
      var actionButtons = [{
        title: 'New',
        type: 'confirm',
        action: this.createNewEnv
      }, {
        title: 'More',
        type: 'show-profile',
        action: this.showProfile
      }];

      return (
        <juju.components.Panel
          instanceName="env-list-panel"
          visible={true}>
          <ul className="env-list">
            {this.generateEnvList()}
          </ul>
          <input
            type="text"
            name="envName"
            placeholder="New environment name"
            onChange={this.envNameChange}
            className="env-list__input"
            ref="envName"/>
          <juju.components.ButtonRow buttons={actionButtons} />
        </juju.components.Panel>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row',
  'panel-component'
]});

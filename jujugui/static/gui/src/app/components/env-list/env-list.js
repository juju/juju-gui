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
      createNewEnv: React.PropTypes.func,
    },

    getInitialState: function() {
      return {
        envs: this.props.envs,
        envName: '',
        selectedModel: null
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
            role="menuitem"
            tabIndex="0"
            data-id={env.uuid}
            data-name={envName}
            onClick={this._handleModelClick}
            key={env.uuid}>
            {envName}
          </li>);
      }, this);
      return envs;
    },

    /**
      Handle clicking on a model.

      @method _handleModelClick
      @param {Object} e The click event.
    */
    _handleModelClick: function(e) {
      var currentTarget = e.currentTarget;
      var state = {
        selectedModel: {
          id: currentTarget.getAttribute('data-id'),
          name: currentTarget.getAttribute('data-name')
        }
      };
      this.setState(state, () => {
        // Delay switching the model so that the state will have been update
        // with the selected model.
        this.props.handleEnvClick(this.state.selectedModel);
      });
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

    /**
      Generate the list of models.

      @method _generateModelList
    */
    _generateModels: function() {
      return (
        <div>
          <ul className="env-list"
            role="menubar"
            id="environmentSwitcherMenu"
            aria-expanded="true"
            aria-hidden="false"
            aria-labelledby="environmentSwitcherToggle">
            {this.generateEnvList()}
          </ul>
          <input
            type="text"
            name="envName"
            placeholder="New model name"
            onChange={this.envNameChange}
            className="env-list__input"
            ref="envName"/>
        </div>
      );
    },

    render: function() {
      var buttons = [{
        title: 'More',
        type: 'base',
        action: this.showProfile
      }, {
        title: 'New',
        type: 'neutral',
        action: this.createNewEnv
      }];
      return (
        <juju.components.Panel
          instanceName="env-list-panel"
          visible={true}>
          {this._generateModels()}
          <juju.components.ButtonRow buttons={buttons} />
        </juju.components.Panel>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row',
  'panel-component'
]});

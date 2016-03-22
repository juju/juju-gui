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
      uncommittedChanges: React.PropTypes.bool.isRequired
    },

    getInitialState: function() {
      return {
        envs: this.props.envs,
        envName: '',
        selectedModel: null,
        showConfirm: false
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
      var uncommittedChanges = this.props.uncommittedChanges;
      var state = {
        selectedModel: {
          id: currentTarget.getAttribute('data-id'),
          name: currentTarget.getAttribute('data-name')
        }
      };
      // If there are uncommitted changes then get the user to confirm the
      // switch.
      if (uncommittedChanges) {
        state.showConfirm = true;
      }
      this.setState(state, () => {
        // Delay switching the model so that the state will have been update
        // with the selected model.
        if (!uncommittedChanges) {
          // If there are no uncommitted changes then we're OK to go ahead and
          // switch models.
          this._switchModel();
        }
      });
    },

    /**
      Handle switching models.

      @method _switchModel
    */
    _switchModel: function() {
      this.props.handleEnvClick(this.state.selectedModel);
    },

    /**
      Handle cancelling switching models.

      @method _cancelSwitchModel
    */
    _cancelSwitchModel: function() {
      this.setState({showConfirm: false});
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

    /**
      Generate the list of models.

      @method _generateConfirm
    */
    _generateConfirm: function() {
      return (
        <div className="env-list__message">
          You have uncommitted changes to your model. You will lose these
          changes if you switch models.
        </div>
      );
    },

    render: function() {
      var buttons;
      var content;
      if (this.state.showConfirm) {
        buttons = [{
          title: 'Cancel',
          type: 'base',
          action: this._cancelSwitchModel
        }, {
          title: 'Switch',
          type: 'neutral',
          action: this._switchModel
        }];
        content = this._generateConfirm();
      } else {
        buttons = [{
          title: 'More',
          type: 'base',
          action: this.showProfile
        }, {
          title: 'New',
          type: 'neutral',
          action: this.createNewEnv
        }];
        content = this._generateModels();
      }
      return (
        <juju.components.Panel
          instanceName="env-list-panel"
          visible={true}>
          {content}
          <juju.components.ButtonRow buttons={buttons} />
        </juju.components.Panel>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row',
  'panel-component'
]});

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

YUI.add('env-switcher', function() {

  var EnvSwitcher = React.createClass({
    propTypes: {
      jem: React.PropTypes.object,
      env: React.PropTypes.object,
      environmentName: React.PropTypes.string,
      showConnectingMask: React.PropTypes.func.isRequired,
      dbEnvironmentSet: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      uncommittedChanges: React.PropTypes.bool.isRequired
    },

    getInitialState: function() {
      return {
        showEnvList: false,
        envList: []
      };
    },

    componentDidMount: function() {
      this.updateEnvList();
    },

    /**
      Close the switcher when there is a click outside of the component.
      Called by the component wrapper.

      @method handleClickOutside
      @param {Object} e The click event
    */
    handleClickOutside: function(e) {
      this.setState({showEnvList: false});
    },

    /**
      Calls to the environment to list the active environments.

      @method updateEnvList
      @param {Function} callback The callback to call after the list has been
        updated.
    */
    updateEnvList: function(callback) {
      var jem = this.props.jem;
      if (jem) {
        jem.listEnvironments(
          this._updateEnvListCallback.bind(this, callback));
      } else {
        this.props.env.listModelsWithInfo(
          this._updateEnvListCallback.bind(this, callback, null));
      }
    },

    /**
      Sets the state with the supplied data from env.listModelsWithInfo and
      jem.listEnvironments calls.

      @method _updateEnvListCallback
      @param {Function} callback The callback to call after the list has been
        updated.
      @param {Object} data The data from the call.
    */
    _updateEnvListCallback: function(callback, error, data) {
      // We need to coerce error types returned by JES vs JEM into one error.
      var err = data.err || error;
      if (err) {
        console.log(err);
        return;
      }

      // data.models is only populated by the call to the controller; when
      // using JEM the environments are in the top level 'data' object.
      var envList = data;
      if (data.models) {
        envList = data.models.filter(function(model) {
          return model.isAlive;
        });
      }
      this.setState({envList: envList});
      if (callback) {
        callback();
      }
    },

    /**
      Sets the state of the 'showEnvList' property to the inverse of what
      it was.

      @method toggleEnvList
      @param {Object} e The click event.
    */
    toggleEnvList: function(e) {
      e.preventDefault();
      this.updateEnvList();
      this.setState({ showEnvList: !this.state.showEnvList });
    },

    /**
      Sets the state of the 'showEnvList' property to the inverse of what
      it was when <Enter> or <Space> is clicked.

      @method handleKeyToggle
    */
    handleKeyToggle: function(e) {
      var key = e.which || e.keyCode || 0;
      // key === <Enter> or <Space>
      if (key === 13 || key === 32) {
        this.toggleEnvList(e);
      }
    },

    /**
      Hides the env list and calls the switchModel method based on the data-id
      of the currentTarget passed to this click handler.

      @method handleEnvClick
      @param {String} model The model to switch to.
    */
    handleEnvClick: function(model) {
      var props = this.props;
      props.showConnectingMask();
      this.setState({showEnvList: false});
      props.switchModel(model.id, this.state.envList);
    },

    /**
      Create a new environment.

      @method createNewEnv
    */
    createNewEnv: function(customEnvName) {
      this.setState({showEnvList: false});
      var jem = this.props.jem;
      var envOwnerName = 'admin';
      var auth = this.props.authDetails;
      if (auth && auth.user) {
        envOwnerName = auth.user;
      }
      // Use the custom provided name or fall back to an auto-incremented one.
      var envName = customEnvName || 'new-env-' + this.state.envList.length;
      // Generates an alphanumeric string
      var randomString = () => Math.random().toString(36).slice(2);
      var password = randomString() + randomString();

      // XXX j.c.sackett 2015-10-28 When we have the UI for template creation
      // and template selection in the GUI, this code should be updated to not
      // select template based on state server.
      var srvCb = (error, servers) => {
        if (error) {
          console.log(error);
          return;
        }
        if (servers && servers.length > 0 && servers[0].path) {
          var serverName = servers[0].path;
          var baseTemplate = serverName;
          jem.newEnvironment(
            envOwnerName, envName, baseTemplate, serverName, password,
            this.createModelCallback);
        } else {
          console.log(
            'Cannot create a new model: No controllers found.');
        }
      };

      if (jem) {
        jem.listServers(srvCb);
      } else {
        this.props.env.createModel(
            envName, 'user-admin', this.createModelCallback.bind(this, null));
      }
    },

    /**
      Handle the callback for the new env creation.

      @method createModelCallback
      @param {Object} data The data from the create env callback.
    */
    createModelCallback: function(error, data) {
      // We need to coerce error types returned by JES vs JEM into one error.
      var err = data.err || error;
      if (err) {
        // XXX frankban: the error should be surfaced to the user.
        console.log('error creating new model:', err);
        return;
      }
      this.props.dbEnvironmentSet('name', data.name || data.path);
      this.updateEnvList(this.props.switchModel.bind(
        this, data.uuid, this.state.envList));
    },

    /**
      Calls changestate to show the user profile.

      @method showUserProfile
    */
    showUserProfile: function() {
      this.props.changeState({
        sectionC: {
          component: 'profile',
          metadata: {}
        }
      });
    },

    /**
      Returns the environment list components if the showEnvList state property
      is truthy.

      @method environmentList
      @return {Function} The EnvList component.
    */
    environmentList: function() {
      if (this.state.showEnvList) {
        return <juju.components.EnvList
          handleEnvClick={this.handleEnvClick}
          createNewEnv={this.createNewEnv}
          showUserProfile={this.showUserProfile}
          uncommittedChanges={this.props.uncommittedChanges}
          envs={this.state.envList} />;
      }
      return '';
    },

    render: function() {
      return (
        <div className="env-switcher"
          role="navigation"
          aria-label="Model switcher">
          <div
            className="env-switcher--toggle"
            onClick={this.toggleEnvList}
            onKeyPress={this.handleKeyToggle}
            id="environmentSwitcherToggle"
            role="button"
            tabIndex="0"
            aria-haspopup="true"
            aria-owns="environmentSwitcherMenu"
            aria-controls="environmentSwitcherMenu"
            aria-expanded="false">
            <span className="environment-name">
              {this.props.environmentName}
            </span>
            <juju.components.SvgIcon name="chevron_down_16"
              size="16" />
          </div>
          {this.environmentList()}
        </div>
      );
    }
  });

  // Wrap the component to handle clicking outside.
  juju.components.EnvSwitcher = enhanceWithClickOutside(EnvSwitcher);

}, '0.1.0', { requires: [
  'env-list',
  'svg-icon'
] });

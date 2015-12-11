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

  juju.components.EnvSwitcher = React.createClass({

    propTypes: {
      jem: React.PropTypes.object,
      env: React.PropTypes.object,
      environmentName: React.PropTypes.string,
      app: React.PropTypes.object
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
      Calls to the environment to list the active environments.

      @method updateEnvList
      @param {Function} callback The callback to call after the list has been
        updated.
    */
    updateEnvList: function(callback) {
      var jem = this.props.jem;
      if (jem) {
        jem.listEnvironments(
          this.updateEnvListCallback.bind(this, callback));
      } else {
        this.props.env.listEnvs(
            'user-admin',
            this.updateEnvListCallback.bind(this, callback, null));
      }
    },

    /**
      Sets the state with the supplied data from the listEnvs call.

      @method updateEnvListCallback
      @param {Function} callback The callback to call after the list has been
        updated.
      @param {Object} data The data from the listEnvs call.
    */
    updateEnvListCallback: function(callback, error, data) {
      // We need to coerce error types returned by JES vs JEM into one error.
      var err = data.err || error;
      if (err) {
        console.log(err);
        return;
      }
      // data.envs is only populated in the JES environments, when using JEM
      // the environments are in the top level 'data' object.
      this.setState({envList: data.envs || data});
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
      Hides the env list and calls the switchEnv method based on the data-id of
      the currentTarget passed to this click handler.

      @method handleEnvClick
      @param {Object} e The click event.
    */
    handleEnvClick: function(e) {
      var uuid = e.currentTarget.getAttribute('data-id');
      this.setState({showEnvList: false});
      this.switchEnv(uuid);
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
      if (auth && auth.user && auth.user.name) {
        envOwnerName = auth.user.name;
      }
      // Use the custom provided name or fall back to an auto-incremented one.
      var envName = customEnvName || 'new-env-' + this.state.envList.length;
      // Generates an alphanumeric string
      var randomString = () => Math.random().toString(36).slice(2);
      var password = randomString() + randomString();

      // XXX j.c.sackett 2015-10-28 When we have the UI for template creation
      // and template selection in the GUI, this code should be updated to not
      // select template based on state server.
      var srvCb = function(error, servers) {
        if (error) {
          console.log(error);
          return;
        }
        if (servers && servers.length > 0 && servers[0].path) {
          var serverName = servers[0].path;
          var baseTemplate = serverName;
          jem.newEnvironment(
            envOwnerName, envName, baseTemplate, serverName, password,
            this.createEnvCallback.bind(this));
        } else {
          console.log(
            'Cannot create a new environment: No state servers found.');
        }
      };

      if (jem) {
        jem.listServers(srvCb.bind(this));
      } else {
        this.props.env.createEnv(
            envName, 'user-admin', this.createEnvCallback.bind(this, null));
      }
    },

    /**
      Handle the callback for the new env creation.

      @method createEnvCallback
      @param {Object} data The data from the create env callback.
    */
    createEnvCallback: function(error, data) {
      // We need to coerce error types returned by JES vs JEM into one error.
      var err = data.err || error;
      if (err) {
        console.log(err);
        return;
      }
      this.updateEnvList(this.switchEnv.bind(this, data.uuid));
    },

    /**
      Take the supplied UUID, fetch the username and password then call the
      passed in switchEnv method.

      @method switchEnv
      @param {String} uuid The env UUID.
    */
    switchEnv: function(uuid) {
      var username = '';
      var password = '';
      var found = this.state.envList.some((env) => {
        if (env.uuid === uuid) {
          username = env.user;
          password = env.password;
          return true;
        }
      });
      if (!found) {
        console.log('No user credentials for env: ', uuid);
      }
      this.props.app.switchEnv(uuid, username, password);
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
          envs={this.state.envList} />;
      }
      return '';
    },

    render: function() {
      return (
        <div className="env-switcher">
          <div
            className="env-switcher--toggle"
            onClick={this.toggleEnvList}>
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

}, '0.1.0', { requires: [
  'env-list',
  'svg-icon'
] });

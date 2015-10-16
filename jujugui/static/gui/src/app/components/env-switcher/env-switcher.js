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
    */
    updateEnvList: function() {
      app.env.listEnvs('user-admin', this.updateEnvListCallback);
    },

    /**
      Sets the state with the supplied data from the listEnvs call.

      @method updateEnvListCallback
      @param {Object} data The data from the listEnvs call.
    */
    updateEnvListCallback: function(data) {
      if (data.err) {
        console.log(data.err);
      } else {
        this.setState({envList: data.envs});
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
      this.props.app.switchEnv(uuid);
    },

    /**
      Create a new environment.

      @method createNewEnv
    */
    createNewEnv: function(e) {
      this.setState({showEnvList: false});
      // XXX For now we will create a new env with an auto-incrementing
      // number at the end. Users will be able to customize their env names
      // once there is UX for it.
      var envName = 'new-env-' + this.state.envList.length;
      this.props.env.createEnv(
          envName, 'user-admin', this.createEnvCallback);
    },

    /**
      Handle the callback for the new env creation.

      @method createEnvCallback
      @param {Object} data The data from the create env callback.
    */
    createEnvCallback: function(data) {
      if (data.err) {
        console.log(data.err);
      } else {
        this.updateEnvList();
        this.props.app.switchEnv(data.uuid);
      }
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
          envs={this.state.envList} />;
      }
    },

    render: function() {
      return (
        <div className="env-switcher">
          <div
            className="env-switcher--toggle"
            onClick={this.toggleEnvList}>
            ▼
          </div>
          {this.environmentList()}
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'env-list'
] });

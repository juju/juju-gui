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
          envName: '',
          envList: []
        };
    },

    componentDidMount: function() {
      this.updateEnvList();
    },

    updateEnvList: function(data) {
      app.env.listEnvs('user-admin', this.updateEnvListCallback);
    },

    updateEnvListCallback: function(data) {
      if (data.err) {
        console.log(data.err);
      } else {
        this.setState({envList: data.envs});
      }
    },

    createEnvironment: function(e) {
      e.preventDefault();
      this.props.env.createEnv(
          this.state.envName, 'user-admin', this.updateEnvList);
    },

    toggleEnvList: function(e) {
      e.preventDefault();
      this.setState({ showEnvList: !this.state.showEnvList });
    },

    showEnvList: function() {
      if (this.state.showEnvList) {
        return <juju.components.EnvList
          app={this.props.app}
          envs={this.state.envList} />;
      }
    },

    _handleEnvNameChange: function(e) {
      this.setState({envName: e.currentTarget.value});
    },

    render: function() {
      return (
        <div className="env-switcher">
          <form className="env-switcher--create">
            <input
              type="text"
              name="env-name"
              className="env-switcher--input__float"
              placeholder="Environment name"
              value={this.state.envName}
              onChange={this._handleEnvNameChange} />
            <input type="submit"
              className="inspector-button"
              value="Create"
              onClick={this.createEnvironment} />
            <input type="button"
              className="inspector-button"
              value="List"
              onClick={this.toggleEnvList} />
          </form>
          {this.showEnvList()}
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'inspector-button',
  'env-list'
] });

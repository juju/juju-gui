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

YUI.add('user-profile', function() {

  juju.components.UserProfile = React.createClass({

    propTypes: {
      jem: React.PropTypes.object,
      listEnvs: React.PropTypes.func,
      switchEnv: React.PropTypes.func.isRequired,
      changeState: React.PropTypes.func.isRequired,
      dbEnvironmentSet: React.PropTypes.func.isRequired,
      createSocketURL: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        envList: []
      };
    },

    componentWillMount: function() {
      this._fetchEnvironments();
    },

    /**
      Makes a request of JEM or JES to fetch the users availble environments.

      @method _fetchEnvironments
    */
    _fetchEnvironments:  function() {
      var props = this.props;
      var jem = props.jem;
      if (jem) {
        jem.listEnvironments(this._fetchEnvironmentsCallback);
      } else {
        props.listEnvs(
          'user-admin', this._fetchEnvironmentsCallback.bind(this, null));
      }
    },

    /**
      Callback for the JEM and JES list environments call.

      @method _fetchEnvironments
      @param {String} error The error from the request, or null.
      @param {Object} data The data from the request.
    */
    _fetchEnvironmentsCallback: function (error, data) {
      // We need to coerce error types returned by JES vs JEM into one error.
      var err = data.err || error;
      if (err) {
        console.log(err);
        return;
      }
      // data.envs is only populated in the JES environments, when using JEM
      // the environments are in the top level 'data' object.
      this.setState({envList: data.envs || data});
    },

    /**
      Take the supplied UUID, fetch the username and password then call the
      passed in switchEnv method.

      @method switchEnv
      @param {String} uuid The env UUID.
      @param {String} name The env name.
    */
    switchEnv: function(uuid, name) {
      var username = '';
      var password = '';
      var address, port;
      var props = this.props;
      var found = this.state.envList.some((env) => {
        if (env.uuid === uuid) {
          username = env.user;
          password = env.password;
          if (env['host-ports']) {
            var hostport = env['host-ports'][0].split(':');
            address = hostport[0];
            port = hostport[1];
          }
          return true;
        }
      });
      if (!found) {
        console.log('No user credentials for env: ', uuid);
      }
      var socketUrl = props.createSocketURL(address, port, uuid);
      props.switchEnv(socketUrl, username, password);
      props.dbEnvironmentSet('name', name);
      this.close();
    },

    close: function() {
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: null
        }
      });
    },

    render: function() {
      var whitelist = ['path', 'name', 'user', 'uuid', 'host-ports'];
      return (
        <juju.components.Panel
          instanceName="user-profile"
          visible={true}>
          <span className="user-profile__close"
            tabIndex="0" role="button"
            onClick={this.close}>
            <juju.components.SvgIcon name="close_16"
              size="16" />
          </span>
          <juju.components.UserProfileHeader />
          <juju.components.UserProfileList
            title="Models"
            data={this.state.envList}
            uuidKey="uuid"
            switchEnv={this.switchEnv}
            whitelist={whitelist}/>
        </juju.components.Panel>
      );
    }

  });

}, '', {
  requires: [
    'svg-icon',
    'panel-component',
    'user-profile-header',
    'user-profile-list'
  ]
});

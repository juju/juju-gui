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
      changeState: React.PropTypes.func.isRequired,
      charmstore: React.PropTypes.object,
      createSocketURL: React.PropTypes.func.isRequired,
      dbEnvironmentSet: React.PropTypes.func.isRequired,
      interactiveLogin: React.PropTypes.bool,
      jem: React.PropTypes.object,
      listEnvs: React.PropTypes.func,
      showConnectingMask: React.PropTypes.func.isRequired,
      storeUser: React.PropTypes.func.isRequired,
      switchEnv: React.PropTypes.func.isRequired,
      username: React.PropTypes.string
    },

    getDefaultProps: function() {
      return {
        username: ''
      };
    },

    getInitialState: function() {
      return {
        envList: [],
        charmList: [],
        bundleList: []
      };
    },

    componentWillMount: function() {
      this._fetchEnvironments();
      this._fetchEntities('charm');
      this._fetchEntities('bundle');
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

      @method _fetchEnvironmentsCallback
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
      Requests a list from charmstore of the user's entities.

      @method _fetchEntities
      @param {String} type the entity type, charm or bundle
    */
    _fetchEntities:  function(type) {
      var callback = this._fetchEntitiesCallback.bind(this, type);
      var charmstore = this.props.charmstore;
      var username = this.props.username;
      if (charmstore && charmstore.list) {
        charmstore.list(username, callback, type);
      }
    },

    /**
      Munge a single entity into data ready to be displayed on the user's
      profile.

      @method _processEntity
      @param {Object} entity A charm or a bundle from the API.
    */
    _processEntity: function(entity) {
      var tags = entity.tags || [];
      tags = tags.map(function(tag) {
        return (
          <span
            key={tag}
            className="user-profile__entityList-tags">
            {tag}
          </span>
        );
      });
      var cs = this.props.charmstore;
      var url = (cs && cs.url && cs.version) && cs.url + cs.version;
      var entityType = entity.entityType;
      var icon;
      if (url && entityType === 'charm') {
        var id = entity.id.replace('cs:', '');
        var iconURL = `${url}/${id}/icon.svg`;
        // XXX kadams54: move height and width into the CSS in subsequent
        // "make this look pretty" work.
        icon = (
          <img
            className="user-profile__entityList-icon"
            src={iconURL}
            width="24"
            height="24"/>
        );
      }
      // XXX kadams54: need to fetch individual entity icons for bundles.
      // XXX kadams54: need to pull in series info; currently not supported
      // in jujulib so add in subsequent branch.
      return {
        name: entity.name,
        owner: entity.owner,
        tags: tags,
        icon: icon,
        series: []
      };
    },

    /**
      Callback for the request to list a user's entities.

      @method _fetchEntitiesCallback
      @param {String} error The error from the request, or null.
      @param {Object} data The data from the request.
    */
    _fetchEntitiesCallback: function (type, error, data) {
      if (error) {
        console.log(error);
        return;
      }
      // Pull out just the data we need to display.
      var entityList = data.map(this._processEntity, this);
      if (type === 'charm') {
        this.setState({charmList: entityList});
      } else if (type === 'bundle') {
        this.setState({bundleList: entityList});
      }
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
      props.showConnectingMask();
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

    /**
      Calls the bakery to get a charmstore macaroon.

      @method _interactiveLogin
    */
    _interactiveLogin: function() {
      var bakery = this.props.charmstore.bakery;
      bakery.fetchMacaroonFromStaticPath(this._fetchMacaroonCallback);
    },

    /**
      Callback for fetching the macaroon.

      @method _fetchMacaroonCallback
      @param {String|Object|Null} error The error response from the callback.
      @param {String} macaroon The resolved macaroon.
    */
    _fetchMacaroonCallback: function(error, macaroon) {
      if (error) {
        console.log(error);
      } else {
        this.props.storeUser('charmstore', macaroon);
      }
    },

    render: function() {
      var whitelist = ['path', 'name', 'user', 'uuid', 'host-ports'];
      var charmCount = this.state.charmList && this.state.charmList.length;
      var bundleCount = this.state.bundleList && this.state.bundleList.length;
      var envCount = this.state.envList && this.state.envList.length;
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
          <div className="twelve-col">
            <div className="inner-wrapper">
              <juju.components.UserProfileHeader
                avatar=""
                bundleCount={bundleCount || 0}
                charmCount={charmCount || 0}
                environmentCount={envCount || 0}
                interactiveLogin={this.props.interactiveLogin ?
                  this._interactiveLogin : undefined}
                username={this.props.username} />
              <juju.components.UserProfileList
                title="Models"
                data={this.state.envList}
                uuidKey="uuid"
                clickHandler={this.switchEnv}
                whitelist={whitelist}/>
              <juju.components.UserProfileList
                title="Charms"
                data={this.state.charmList}
                uuidKey="id" />
              <juju.components.UserProfileList
                title="Bundles"
                data={this.state.bundleList}
                uuidKey="id" />
            </div>
          </div>
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

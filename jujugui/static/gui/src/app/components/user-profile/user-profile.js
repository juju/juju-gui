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
      getDiagramURL: React.PropTypes.func.isRequired,
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
      if (type === 'charm') {
        this.setState({charmList: data});
      } else if (type === 'bundle') {
        this.setState({bundleList: data});
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

    /**
      Generate the rows of model details.

      @method _generateModelRows
      @returns {Array} The markup for the rows.
    */
    _generateModelRows: function() {
      var components = [];
      this.state.envList.forEach((model) => {
        var uuid = model.uuid;
        components.push(
          <juju.components.UserProfileEntity
            entity={model}
            key={uuid}
            switchEnv={this.props.switchEnv}
            type="model">
            <span className="user-profile__list-col three-col">
              {model.name}
            </span>
            <span className="user-profile__list-col four-col">
              --
            </span>
            <span className="user-profile__list-col two-col">
              {model.lastConnection}
            </span>
            <span className="user-profile__list-col one-col">
              --
            </span>
            <span className="user-profile__list-col two-col last-col">
              {model.owner}
            </span>
          </juju.components.UserProfileEntity>);
      });
      return components;
    },

    /**
      Generate a list of tags.

      @method _generateTags
      @param {Array} tags A list of tags.
      @param {String} id The id of the entity.
      @returns {Object} A list of tag components.
    */
    _generateTags: function(tagList, id) {
      if (!tagList) {
        return;
      }
      var tags = [];
      tagList.forEach((tag) => {
        tags.push(
          <li className="user-profile__comma-item"
            key={id + '-' + tag}>
            {tag}
          </li>);
      });
      return (
        <ul className="user-profile__list-tags">
          {tags}
        </ul>);
    },

    /**
      Construct the URL for a service icon.

      @method _getIcon
      @param {String} id The service ID.
      @returns {String} The icon URL.
    */
    _getIcon: function(id) {
      if (!id) {
        return;
      }
      var cs = this.props.charmstore;
      var path = id.replace('cs:', '');
      return `${cs.url}${cs.version}/${path}/icon.svg`;
    },

    /**
      Generate the rows of bundle details.

      @method _generateBundleRows
      @returns {Array} The markup for the rows.
    */
    _generateBundleRows: function() {
      var components = [];
      this.state.bundleList.forEach((bundle) => {
        var id = bundle.id;
        var services = [];
        var serviceNames = Object.keys(bundle.services);
        serviceNames.forEach((serviceName, idx) => {
          var service = bundle.services[serviceName];
          var id = service.charm;
          var key = `icon-${idx}-${id}`;
          services.push(
            <img className="user-profile__list-icon"
              key={key}
              src={this._getIcon(id)}
              title={service.charm} />);
        });
        // XXX kadams54: Need to pull in unit count.
        components.push(
          <juju.components.UserProfileEntity
            changeState={this.props.changeState}
            entity={bundle}
            getDiagramURL={this.props.getDiagramURL}
            key={id}
            type="bundle">
            <span className={'user-profile__list-col five-col ' +
              'user-profile__list-name'}>
              {bundle.name}
              {this._generateTags(bundle.tags, id)}
            </span>
            <span className={'user-profile__list-col three-col ' +
              'user-profile__list-icons'}>
              {services}
            </span>
            <span className="user-profile__list-col one-col prepend-one">
              [unit #]
            </span>
            <span className="user-profile__list-col two-col last-col">
              {bundle.owner}
            </span>
          </juju.components.UserProfileEntity>);
      });
      return components;
    },

    /**
      Generate the rows of charm details.

      @method _generateCharmRows
      @returns {Array} The markup for the rows.
    */
    _generateCharmRows: function() {
      var components = [];
      this.state.charmList.forEach((charm) => {
        var id = charm.id;
        // Ensure the icon is set.
        charm.icon = charm.icon || this._getIcon(id);
        // XXX kadams54: Need to add support for parsing SupportedSeries to
        // jujulib and then using that info to populate the series below.
        components.push(
          <juju.components.UserProfileEntity
            changeState={this.props.changeState}
            entity={charm}
            key={id}
            type="charm">
            <span className={'user-profile__list-col three-col ' +
              'user-profile__list-name'}>
              {charm.name}
              {this._generateTags(charm.tags, id)}
            </span>
            <span className="user-profile__list-col four-col">
              [series]
            </span>
            <span className={'user-profile__list-col one-col ' +
              'user-profile__list-icons'}>
              <img className="user-profile__list-icon"
                src={charm.icon}
                title={charm.name} />
            </span>
            <span className={'user-profile__list-col two-col ' +
              'prepend-two last-col'}>
              {charm.owner}
            </span>
          </juju.components.UserProfileEntity>);
      });
      return components;
    },

    render: function() {
      var charmList = this.state.charmList,
          bundleList = this.state.bundleList,
          envList = this.state.envList,
          charmCount = (charmList && charmList.length) || 0,
          bundleCount = (bundleList && bundleList.length) || 0,
          envCount = (envList && envList.length) || 0;
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
                bundleCount={bundleCount}
                charmCount={charmCount}
                environmentCount={envCount}
                interactiveLogin={this.props.interactiveLogin ?
                  this._interactiveLogin : undefined}
                username={this.props.username} />
              <div className="user-profile__header">
                Models
                <span className="user-profile__size">
                  ({envCount})
                </span>
              </div>
              <ul className="user-profile__list twelve-col">
                <li className="user-profile__list-header twelve-col">
                  <span className="user-profile__list-col three-col">
                    Name
                  </span>
                  <span className="user-profile__list-col four-col">
                    Credential
                  </span>
                  <span className="user-profile__list-col two-col">
                    Last accessed
                  </span>
                  <span className="user-profile__list-col one-col">
                    Units
                  </span>
                  <span className={
                    'user-profile__list-col two-col last-col'}>
                    Owner
                  </span>
                </li>
                {this._generateModelRows()}
              </ul>
              <div className="user-profile__header">
                Bundles
                <span className="user-profile__size">
                  ({bundleCount})
                </span>
              </div>
              <ul className="user-profile__list twelve-col">
                <li className="user-profile__list-header twelve-col">
                  <span className="user-profile__list-col seven-col">
                    Name
                  </span>
                  <span className="user-profile__list-col two-col">
                    Charms
                  </span>
                  <span className="user-profile__list-col one-col">
                    Units
                  </span>
                  <span className={
                    'user-profile__list-col two-col last-col'}>
                    Owner
                  </span>
                </li>
                {this._generateBundleRows()}
              </ul>
              <div className="user-profile__header">
                Charms
                <span className="user-profile__size">
                  ({charmCount})
                </span>
              </div>
              <ul className="user-profile__list twelve-col">
                <li className="user-profile__list-header twelve-col">
                  <span className="user-profile__list-col three-col">
                    Name
                  </span>
                  <span className="user-profile__list-col seven-col">
                    Series
                  </span>
                  <span className="user-profile__list-col two-col last-col">
                    Owner
                  </span>
                </li>
                {this._generateCharmRows()}
              </ul>
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
    'user-profile-entity',
    'user-profile-header'
  ]
});

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
    xhrs: [],

    propTypes: {
      addNotification: React.PropTypes.func.isRequired,
      canCreateNew: React.PropTypes.bool.isRequired,
      changeState: React.PropTypes.func.isRequired,
      charmstore: React.PropTypes.object.isRequired,
      currentModel: React.PropTypes.string,
      env: React.PropTypes.object.isRequired,
      getDiagramURL: React.PropTypes.func.isRequired,
      interactiveLogin: React.PropTypes.bool,
      listModels: React.PropTypes.func.isRequired,
      pluralize: React.PropTypes.func.isRequired,
      staticURL: React.PropTypes.string,
      storeUser: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      user: React.PropTypes.object,
      users: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      return {
        destroyModel: null,
        envList: [],
        charmList: [],
        bundleList: [],
        loadingBundles: false,
        loadingCharms: false,
        loadingModels: false
      };
    },

    componentWillMount: function() {
      var props = this.props,
          users = props.users;
      if (props.user.user) {
        this._fetchEnvironments();
      }
      if (users.charmstore && users.charmstore.user) {
        this._fetchEntities('charm', props);
        this._fetchEntities('bundle', props);
      }
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    componentWillReceiveProps: function(nextProps) {
      // If the user has changed then update the data.
      var props = this.props;
      var previousUser = this.props.user.user;
      var newUser = nextProps.user.user;
      if (newUser && newUser !== previousUser) {
        this._fetchEnvironments();
      }
      // Compare next and previous charmstore users in a data-safe manner.
      var prevCSUser = props.users.charmstore || {};
      var nextCSUser = nextProps.users.charmstore || {};
      if (nextCSUser.user && nextCSUser.user !== prevCSUser.user) {
        this._fetchEntities('charm', nextProps);
        this._fetchEntities('bundle', nextProps);
      }
    },

    /**
      Makes a request of JEM or JES to fetch the users availble environments.

      @method _fetchEnvironments
    */
    _fetchEnvironments: function() {
      // Delay the call until after the state change to prevent race
      // conditions.
      this.setState({loadingModels: true}, () => {
        var xhr = this.props.listModels(this._fetchModelsCallback);
        this.xhrs.push(xhr);
      });
    },

    /**
      Callback for the JEM and JES list models call.

      @method _fetchModelsCallback
      @param {Object} models The list of models.
    */
    _fetchModelsCallback: function(models) {
      this.setState({
        envList: models,
        loadingModels: false
      });
    },

    /**
      Requests a list from charmstore of the user's entities.

      @method _fetchEntities
      @param {String} type the entity type, charm or bundle
      @param {Object} props the properties to use when connection to charmstore
    */
    _fetchEntities:  function(type, props) {
      var callback = this._fetchEntitiesCallback.bind(this, type);
      var charmstore = props.charmstore;
      var username = props.users.charmstore && props.users.charmstore.user;
      if (charmstore && charmstore.list && username) {
        var state = {};
        if (type === 'charm') {
          state.loadingCharms = true;
        } else {
          state.loadingBundles = true;
        }
        this.setState(state, () => {
          // Delay the call until after the state change to prevent race
          // conditions.
          var xhr = charmstore.list(username, callback, type);
          this.xhrs.push(xhr);
        });
      }
    },

    /**
      Callback for the request to list a user's entities.

      @method _fetchEntitiesCallback
      @param {String} error The error from the request, or null.
      @param {Object} data The data from the request.
    */
    _fetchEntitiesCallback: function(type, error, data) {
      // Turn off the loader, regardless of success or error.
      if (type === 'charm') {
        this.setState({loadingCharms: false});
      } else if (type === 'bundle') {
        this.setState({loadingBundles: false});
      }
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
      passed in switchModel method. If the UUID and name are null, simply
      disconnect without reconnecting to a new model.

      @method switchModel
      @param {String} uuid The model UUID.
      @param {String} name The model name.
      @param {Function} callback The function to be called once the model has
        been switched and logged into. Takes the following parameters:
        {Object} env The env that has been switched to.
    */
    switchModel: function(uuid, name, callback) {
      var props = this.props;
      props.switchModel(uuid, this.state.envList, name, callback);
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
        this.props.storeUser('charmstore', true);
      }
    },

    /**
      Generate the details for the provided model.

      @method _generateModelRow
      @param {Object} model A model object.
      @returns {Array} The markup for the row.
    */
    _generateModelRow: function(model) {
      var uuid = model.uuid;
      var isCurrent = uuid === this.props.currentModel;
      if (!model.isAlive) {
        return (
          <li className="user-profile__entity user-profile__list-row"
            key={uuid}>
            {model.name} is being destroyed.
          </li>);
      }
      return (
        <juju.components.UserProfileEntity
          entity={model}
          expanded={isCurrent}
          key={uuid}
          displayConfirmation={this._displayConfirmation.bind(this, model)}
          switchModel={this.switchModel}
          type="model">
          <span className="user-profile__list-col three-col">
            {model.name || '--'}
          </span>
          <span className="user-profile__list-col four-col">
            --
          </span>
          <span className="user-profile__list-col two-col">
            {model.lastConnection || '--'}
          </span>
          <span className="user-profile__list-col one-col">
            --
          </span>
          <span className="user-profile__list-col two-col last-col">
            {model.owner || '--'}
          </span>
        </juju.components.UserProfileEntity>);
    },

    /**
      Generate the header for the models.

      @method _generateModelHeader
      @returns {Array} The markup for the header.
    */
    _generateModelHeader: function() {
      return (
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
        </li>);
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
      Generate a list of series.

      @method _generateSeries
      @param {Array} series A list of series.
      @param {String} id The id of the entity.
      @returns {Object} A list of series components.
    */
    _generateSeries: function(series, id) {
      if (!series) {
        return;
      }
      var listItems = [];
      series.forEach((release) => {
        listItems.push(
          <li className="user-profile__comma-item"
            key={id + '-' + release}>
            {release}
          </li>);
      });
      return (
        <ul className="user-profile__list-series">
          {listItems}
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
      return `${cs.url}/${path}/icon.svg`;
    },

    /**
      Generate the details for the provided bundle.

      @method _generateBundleRow
      @param {Object} bundle A bundle object.
      @returns {Array} The markup for the row.
    */
    _generateBundleRow: function(bundle) {
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
      var unitCount = bundle.unitCount || <span>&nbsp;</span>;
      return (
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
            {unitCount}
          </span>
          <span className="user-profile__list-col two-col last-col">
            {bundle.owner}
          </span>
        </juju.components.UserProfileEntity>);
    },

    /**
      Generate the header for the bundles.

      @method _generateBundleHeader
      @returns {Array} The markup for the header.
    */
    _generateBundleHeader: function() {
      return (
        <li className="user-profile__list-header twelve-col">
          <span className="user-profile__list-col five-col">
            Name
          </span>
          <span className={'user-profile__list-col three-col ' +
            'user-profile__list-icons'}>
            Charms
          </span>
          <span className="user-profile__list-col one-col prepend-one">
            Units
          </span>
          <span className={
            'user-profile__list-col two-col last-col'}>
            Owner
          </span>
        </li>);
    },

    /**
      Generate the details for the provided charm.

      @method _generateCharmRow
      @param {Object} charm A charm object.
      @returns {Array} The markup for the row.
    */
    _generateCharmRow: function(charm) {
      var id = charm.id;
      // Ensure the icon is set.
      charm.icon = charm.icon || this._getIcon(id);
      return (
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
            {this._generateSeries(charm.series, id)}
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
    },

    /**
      Generate the header for the charms.

      @method _generateCharmHeader
      @returns {Array} The markup for the header.
    */
    _generateCharmHeader: function() {
      return (
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
        </li>);
    },

    /**
      Generate the rows of for the provided entity.

      @method _generateRows
      @param {String} type The type of entity.
      @param {Array} list The list of entities.
      @param {Boolean} loading Whether the data is loading.
      @returns {Array} The markup for the rows.
    */
    _generateRows: function(type, list, loading) {
      if (loading) {
        return (
          <div className="twelve-col">
            <juju.components.Spinner />
          </div>);
      }
      if (list.length === 0) {
        return;
      }
      var generateRow;
      var header;
      var rows = [];
      var title;
      var actions;
      if (type === 'models') {
        generateRow = this._generateModelRow;
        header = this._generateModelHeader();
        title = 'Models';
        if (this.props.canCreateNew) {
          actions = (
            <div className="user-profile__create-new">
              <juju.components.GenericButton
                action={this.switchModel}
                type='inline-neutral'
                title='Create new' />
            </div>);
        }
      } else if (type === 'bundles') {
        generateRow = this._generateBundleRow;
        header = this._generateBundleHeader();
        title = 'Bundles';
      } else if (type === 'charms') {
        generateRow = this._generateCharmRow;
        header = this._generateCharmHeader();
        title = 'Charms';
      }
      list.forEach((model) => {
        rows.push(generateRow(model));
      });
      return (
        <div>
          <div className="user-profile__header twelve-col no-margin-bottom">
            {title}
            <span className="user-profile__size">
              ({list.length})
            </span>
            {actions}
          </div>
          <ul className="user-profile__list twelve-col">
            {header}
            {rows}
          </ul>
        </div>);
    },

    /**
      Generate the content for the panel.

      @method _generateContent
      @returns {Array} The markup for the content.
    */
    _generateContent: function() {
      var state = this.state;
      // We can't be loading anything, and all the lists must be empty.
      var isEmpty = !state.loadingBundles
                    && !state.loadingCharms
                    && !state.loadingModels
                    && state.bundleList.length === 0
                    && state.charmList.length === 0
                    && state.envList.length === 0;
      if (isEmpty) {
        var staticURL = this.props.staticURL || '';
        var basePath = `${staticURL}/static/gui/build/app`;
        return (
          <div className="user-profile__empty twelve-col no-margin-bottom">
            <img alt="Empty profile"
              className="user-profile__empty-image"
              src={`${basePath}/assets/images/non-sprites/empty_profile.png`} />
            <h2 className="user-profile__empty-title">
              Your profile is currently empty
            </h2>
            <p className="user-profile__empty-text">
              Your models, bundles and charms will appear here when you create
              them.
            </p>
            <p className="user-profile__empty-button">
              <juju.components.GenericButton
                action={this.switchModel}
                type='inline-neutral'
                title='Create new model' />
            </p>
          </div>);
      }
      return (
        <div>
          {this._generateRows('models', state.envList, state.loadingModels)}
          {this._generateRows(
            'bundles', state.bundleList, state.loadingBundles)}
          {this._generateRows('charms', state.charmList, state.loadingCharms)}
        </div>);
    },

    /**
      Display the confirmation for destroying a model.

      @method _displayConfirmation
      @param {String} model The model to destroy.
      @return {Object} The confirmation component.
    */
    _displayConfirmation: function(model) {
      this.setState({destroyModel: model});
    },

    /**
      Handle the destroy model button being clicked.

      @method _handleDestroyModel
    */
    _handleDestroyModel: function() {
      var model = this.state.destroyModel;
      var uuid = model.uuid;
      // Hide the confirmation popup.
      this._displayConfirmation(null);
      // If the model to be distroyed is active then we can destroy it
      // immediately.
      if (uuid === this.props.currentModel) {
        this._destroyModel(this.props.env);
      } else {
        // Switch to the selected model, then destroy it.
        // TODO: investigate how to handle situations where the
        // switchModel/switchEnv fails and so the callback to destroy the model
        // is never called.
        this.switchModel(uuid, model.name, this._destroyModel);
      }
    },

    /**
      Destroy a model.

      @method _destroyModel
      @param {Object} env The current env.
    */
    _destroyModel: function(env) {
      env.destroyModel((error) => {
        if (error) {
          this.props.addNotification({
            title: 'Model destruction failed',
            message: 'The model failed to be destroyed: ' + error,
            level: 'error'
          });
          return;
        }
        this.props.addNotification({
          title: 'Model destroyed',
          message: 'The model is currently being destroyed.',
          level: 'important'
        });
        this.switchModel(null, null);
      });
    },

    /**
      Generate the confirmation for destroying a model.

      @method _generateConfirmation
      @return {Object} The confirmation component.
    */
    _generateConfirmation: function() {
      var model = this.state.destroyModel;
      if (!model) {
        return;
      }
      var buttons = [{
        title: 'Cancel',
        action: this._displayConfirmation.bind(this, null),
        type: 'base'
      }, {
        title: 'Destroy',
        action: this._handleDestroyModel,
        type: 'destructive'
      }];
      var name = model.name.split('/')[1];
      var message = `Are you sure you want to destroy ${name}? All the ` +
        'services and units included in the model will be destroyed. This ' +
        'action cannot be undone.';
      return (
        <juju.components.ConfirmationPopup
          buttons={buttons}
          message={message}
          title="Destroy model" />);
    },

    render: function() {
      var username = this.props.user && this.props.user.usernameDisplay;
      var bundleCount = this.state.bundleList.length;
      var charmCount = this.state.charmList.length;
      var modelCount = this.state.envList.length;
      var pluralize = this.props.pluralize;
      var links = [{
        label: `${modelCount} ${pluralize('model', modelCount)}`
      }, {
        label: `${bundleCount} ${pluralize('bundle', bundleCount)}`
      }, {
        label: `${charmCount} ${pluralize('charm', charmCount)}`
      }];
      return (
        <juju.components.Panel
          instanceName="user-profile"
          visible={true}>
          <div className="twelve-col">
            <div className="inner-wrapper">
              <juju.components.UserProfileHeader
                users={this.props.users}
                avatar=""
                interactiveLogin={this.props.interactiveLogin ?
                  this._interactiveLogin : undefined}
                links={links}
                username={username} />
              {this._generateContent()}
            </div>
          </div>
          {this._generateConfirmation()}
        </juju.components.Panel>
      );
    }

  });

}, '', {
  requires: [
    'confirmation-popup',
    'loading-spinner',
    'svg-icon',
    'panel-component',
    'user-profile-entity',
    'user-profile-header'
  ]
});

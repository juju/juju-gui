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
      getAgreements: React.PropTypes.func.isRequired,
      getDiagramURL: React.PropTypes.func.isRequired,
      hideConnectingMask: React.PropTypes.func.isRequired,
      interactiveLogin: React.PropTypes.bool,
      jem: React.PropTypes.object,
      listBudgets: React.PropTypes.func.isRequired,
      listModels: React.PropTypes.func.isRequired,
      pluralize: React.PropTypes.func.isRequired,
      showConnectingMask: React.PropTypes.func.isRequired,
      staticURL: React.PropTypes.string,
      storeUser: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      user: React.PropTypes.object,
      users: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      return {
        envList: [],
        loadingModels: false,
        createNewModelActive: false
      };
    },

    componentWillMount: function() {
      this._fetchEnvironments();
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    componentWillReceiveProps: function(nextProps) {
      // If the user has changed then update the data.
      var props = this.props;
      if (nextProps.user.user !== props.user.user) {
        this._fetchEnvironments();
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
      @param {String} error The error from the request, or null.
      @param {Object} data The data from the request.
    */
    _fetchModelsCallback: function(error, data) {
      this.setState({loadingModels: false});
      // We need to coerce error types returned by JES vs JEM into one error.
      var err = data.err || error;
      if (err) {
        console.error(err);
        return;
      }
      // data.models is only populated by Juju controllers, when using JEM
      // the models are in the top level 'data' object.
      var modelList;
      if (data.models) {
        modelList = data.models.map(function(model) {
          // XXX frankban: owner should be the ownerTag without the 'user-'
          // prefix here.
          model.owner = model.ownerTag;
          return model;
        });
      } else if (data.map) {
        modelList = data.map(function(model) {
          // XXX kadams54: JEM models don't *currently* have a name or owner.
          // They have a path which is a combination of both, but that format
          // may change on down the road. Hence this big comment.
          model.name = model.path;
          model.owner = model.path.split('/')[0];
          model.lastConnection = 'N/A';
          // XXX frankban: does JEM provide lifecycle indications?
          model.isAlive = true;
          return model;
        });
      }
      this.setState({envList: modelList});
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
      Fetches the model name from the modelName ref and then creates a model
      then switches to it.
      @method createAndSwitch
      @param {Object} e The event handler from a form submission.
    */
    createAndSwitch: function(e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      // The supplied new model name needs to be valid.
      var modelName = this.refs.modelName;
      if (!modelName.validate()) {
        // Only continue if the validation passes.
        return;
      }
      // Because this will automatically connect to the model lets show
      // the connecting mask right now.
      this.props.showConnectingMask();
      // XXX This is only for the JIMM flow.
      this.props.env.createModel(
        modelName.getValue(),
        this.props.user.user,
        data => {
          var err = data.err;
          if (err) {
            this.props.addNotification({
              title: 'Failed to create new Model',
              message: err,
              level: 'error'
            });
            console.error(err);
            this.props.hideConnectingMask(false);
            return;
          }
          this.switchModel(data.uuid, data.name);
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
      Depending on the existance of jem this will either switch to a
      disconnected model or open up the UI to allow the user to create a
      new model.
      @method _nextCreateStep
    */
    _nextCreateStep: function() {
      if (this.props.jem) {
        // Switch to a disconnected model
        this.switchModel();
      } else {
        // Open up the UI to specify a model name for the Controller.
        this.setState({ createNewModelActive: true }, _ => {
          this.refs.modelName.refs.field.focus();
        });
      }
    },

    /**
      Generates the elements required for the create new button
      @method _generateCreateNew
      @param {String} className The class you'd like to have applied to the
        container.
    */
    _generateCreateNew: function(className) {
      var classes = classNames(
        'user-profile__create-new',
        className,
        {
          collapsed: !this.state.createNewModelActive
        });
      return (
        <div className={classes}>
          <form onSubmit={this.createAndSwitch}>
            <juju.components.GenericButton
              action={this._nextCreateStep}
              type="inline-neutral first"
              title="Create new" />
            <juju.components.GenericInput
              placeholder="untitled_model"
              required={true}
              ref="modelName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
            <juju.components.GenericButton
              action={this.createAndSwitch}
              type="inline-neutral second"
              title="Submit" />
          </form>
        </div>
      );
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
      if (!list || list.length === 0) {
        return;
      }
      var generateRow;
      var header;
      var rows = [];
      var title;
      var createNewButton;
      if (type === 'models') {
        generateRow = this._generateModelRow;
        header = this._generateModelHeader();
        title = 'Models';
        if (this.props.canCreateNew) {
          createNewButton = this._generateCreateNew();
        }
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
            {createNewButton}
          </div>
          <ul className="user-profile__list twelve-col">
            {header}
            {rows}
          </ul>
        </div>);
    },

    /**
      Return a list's length or default to 0, in a manner that doesn't fall
      over when confronted with a null list.

      @method _safeCount
      @returns {Array} The list.
    */
    _safeCount: function(list) {
      return (list && list.length) || 0;
    },

    /**
      Generate the content for the panel.

      @method _generateContent
      @returns {Array} The markup for the content.
    */
    _generateContent: function() {
      var state = this.state;
      // We can't be loading anything, and all the lists must be empty.
      var isLoaded = !state.loadingModels;
      var envCount = this._safeCount(state.envList);
      var isEmpty = envCount === 0;
      if (isLoaded && isEmpty) {
        var header = 'Your profile is currently empty';
        var message = 'Your models, bundles and charms will appear here when'
                      + ' you create them.';
        var staticURL = this.props.staticURL || '';
        var basePath = `${staticURL}/static/gui/build/app`;
        return (
          <div className="user-profile__empty twelve-col no-margin-bottom">
            {this._generateCreateNew('user-profile__empty-button')}
            <div className="clearfix">
              <img alt="Empty profile"
                className="user-profile__empty-image"
                src=
                  {`${basePath}/assets/images/non-sprites/empty_profile.png`} />
              <h2 className="user-profile__empty-title">{header}</h2>
              <p className="user-profile__empty-text">{message}</p>
            </div>
          </div>);
      }
      return (
        <div>
          {this._generateRows('models', state.envList, state.loadingModels)}
          <juju.components.EntityList
            changeState={this.props.changeState}
            charmstore={this.props.charmstore}
            getDiagramURL={this.props.getDiagramURL}
            type='bundle'
            user={this.props.user}
            users={this.props.users} />
          <juju.components.EntityList
            changeState={this.props.changeState}
            charmstore={this.props.charmstore}
            getDiagramURL={this.props.getDiagramURL}
            type='charm'
            user={this.props.user}
            users={this.props.users} />
          <juju.components.AgreementList
            getAgreements={this.props.getAgreements}
            user={this.props.user} />
          <juju.components.BudgetList
            listBudgets={this.props.listBudgets}
            user={this.props.user} />
        </div>);
    },

    render: function() {
      var username = this.props.user && this.props.user.usernameDisplay;
      var state = this.state;
      /* XXX Find some way to percolate these up from the child components. */
      /*
      var bundleCount = this._safeCount(state.bundleList);
      var charmCount = this._safeCount(state.charmList);
      */
      var modelCount = this._safeCount(state.envList);
      var pluralize = this.props.pluralize;
      /* XXX Should include agreements, budgets, etc. in these links. */
      /*
      var links = [{
        label: `${modelCount} ${pluralize('model', modelCount)}`
      }, {
        label: `${bundleCount} ${pluralize('bundle', bundleCount)}`
      }, {
        label: `${charmCount} ${pluralize('charm', charmCount)}`
      }];
      */
      var links = [{
        label: `${modelCount} ${pluralize('model', modelCount)}`
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
        </juju.components.Panel>
      );
    }

  });

}, '', {
  requires: [
    'agreement-list',
    'budget-list',
    'entity-list',
    'generic-input',
    'loading-spinner',
    'panel-component',
    'user-profile-entity',
    'user-profile-header'
  ]
});

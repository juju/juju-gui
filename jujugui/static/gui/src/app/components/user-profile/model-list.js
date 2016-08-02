/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

YUI.add('model-list', function() {

  juju.components.ModelList = React.createClass({
    propTypes: {
      addNotification: React.PropTypes.func.isRequired,
      canCreateNew: React.PropTypes.bool.isRequired,
      currentModel: React.PropTypes.string,
      env: React.PropTypes.object.isRequired,
      hideConnectingMask: React.PropTypes.func.isRequired,
      jem: React.PropTypes.object,
      listModels: React.PropTypes.func.isRequired,
      showConnectingMask: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      user: React.PropTypes.object,
      users: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];

      return {
        modelList: [],
        loadingModels: false,
        createNewModelActive: false
      };
    },

    componentWillMount: function() {
      this._fetchModels();
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    componentWillReceiveProps: function(nextProps) {
      var props = this.props;
      var currentUser = props.user && props.user.user;
      var nextUser = nextProps.user && nextProps.user.user;
      if (nextUser !== currentUser) {
        this._fetchModels();
      }
    },

    /**
      Makes a request of JEM or JES to fetch the user's availble models.

      @method _fetchModels
    */
    _fetchModels:  function() {
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
      this.setState({modelList: modelList});
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
      this.props.switchModel(uuid, this.state.modelList, name, callback);
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
      Generate the details for the provided model.

      @method _generateRow
      @param {Object} model A model object.
      @returns {Array} The markup for the row.
    */
    _generateRow: function(model) {
      var uuid = model.uuid;
      var isCurrent = uuid === this.props.currentModel;
      if (!model.isAlive) {
        if (model.name) {
          return (
            <li className="user-profile__entity user-profile__list-row"
              key={uuid}>
              {model.name} is being destroyed.
            </li>);
        } else {
          return null;
        }
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

      @method _generateHeader
      @returns {Array} The markup for the header.
    */
    _generateHeader: function() {
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

    render: function() {
      if (this.state.loadingModels) {
        return (
          <div className="user-profile__model-list twelve-col">
            <juju.components.Spinner />
          </div>
        );
      }
      var list = this.state.modelList;
      if (!list || list.length === 0) {
        return null;
      }
      var rows = list.map(this._generateRow);
      var createNewButton;
      if (this.props.canCreateNew) {
        createNewButton = this._generateCreateNew();
      }
      return (
        <div className="user-profile__model-list">
          <div className="user-profile__header twelve-col no-margin-bottom">
            Models
            <span className="user-profile__size">
              ({list.length})
            </span>
            {createNewButton}
          </div>
          <ul className="user-profile__list twelve-col">
            {this._generateHeader()}
            {rows}
          </ul>
        </div>
      );
    }

  });

}, '', {
  requires: [
    'generic-button',
    'generic-input',
    'loading-spinner',
    'user-profile-entity'
  ]
});

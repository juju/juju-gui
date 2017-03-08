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

YUI.add('user-profile-model-list', function() {

  juju.components.UserProfileModelList = React.createClass({
    // broadcastStatus is necessary for communicating loading status back to
    // the parent SectionLoadWatcher.
    propTypes: {
      acl: React.PropTypes.object,
      addNotification: React.PropTypes.func.isRequired,
      broadcastStatus: React.PropTypes.func,
      changeState: React.PropTypes.func.isRequired,
      currentModel: React.PropTypes.string,
      destroyModels: React.PropTypes.func.isRequired,
      facadesExist: React.PropTypes.bool.isRequired,
      listModelsWithInfo: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      // userInfo must have the following attributes:
      // - external: the external user name to use for retrieving data, for
      //   instance, from the charm store. Might be null if the user is being
      //   displayed for the current user and they are not authenticated to
      //   the charm store;
      // - isCurrent: whether the profile is being displayed for the currently
      //   authenticated user;
      // - profile: the user name for whom profile details must be displayed.
      userInfo: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];

      return {
        modelList: [],
        loadingModels: false,
      };
    },

    getDefaultProps: function() {
      // Just in case broadcastStatus isn't passed in (e.g., in tests), calls
      // to it should not fail, so default to an empty function.
      return {
        broadcastStatus: function() {}
      };
    },

    componentWillMount: function() {
      this._fetchModels(this.props.facadesExist);
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    componentWillReceiveProps: function(nextProps) {
      const props = this.props;
      if (
        props.userInfo.profile !== nextProps.userInfo.profile ||
        props.facadesExist !== nextProps.facadesExist
      ) {
        this._fetchModels(nextProps.facadesExist);
      }
    },

    /**
      Makes a request of the controller to fetch the user's availble models.

      @method _fetchModels
      @param {Boolean} facadesExist - Whether the controller is
        connected or not.
    */
    _fetchModels:  function(facadesExist) {
      if (!facadesExist) {
        console.warn('Controller not connected, skipping fetching models.');
        return;
      }
      this.props.broadcastStatus('starting');
      // Delay the call until after the state change to prevent race
      // conditions.
      this.setState({loadingModels: true}, () => {
        const xhr = this.props.listModelsWithInfo(this._fetchModelsCallback);
        this.xhrs.push(xhr);
      });
    },

    /**
      Callback for the controller list models call.

      @method _fetchModelsCallback
      @param {String} err The error from the request, or null.
      @param {Array} modelList The list of models.
    */
    _fetchModelsCallback: function(err, modelList) {
      this.setState({loadingModels: false}, () => {
        const broadcastStatus = this.props.broadcastStatus;
        if (err) {
          broadcastStatus('error');
          console.error(err);
          return;
        }
        if (!this.props.userInfo.isCurrent) {
          const extUser = this.props.userInfo.external + '@external';
          modelList = modelList.filter(model => {
            return model.owner === extUser;
          });
        }
        if (modelList.length) {
          broadcastStatus('ok');
        } else {
          broadcastStatus('empty');
        }
        this.setState({modelList: modelList});
      });
    },

    /**
      Display the confirmation for destroying a model.

      @method _displayConfirmation
      @param {Object} model the model to destroy. A model should at least have
                            a name and uuid.
    */
    _displayConfirmation: function(model) {
      this.setState({modelToBeDestroyed: model});
    },

    /**
      Generate the confirmation for destroying a model.

      @method _displayConfirmation
      @return {Object} the confirmation component.
    */
    _generateConfirmation: function() {
      const model = this.state.modelToBeDestroyed;
      const addNotification = this.props.addNotification;
      if (!model) {
        return;
      }
      if (model.isController) {
        addNotification({
          title: 'Cannot destroy model',
          message: 'The controller model cannot be destroyed.',
          level: 'error'
        });
        return;
      }
      const buttons = [{
        title: 'Cancel',
        action: this._displayConfirmation.bind(this, null),
        type: 'base'
      }, {
        title: 'Destroy',
        action: this._destroyModel,
        type: 'destructive'
      }];
      const message = `Are you sure you want to destroy ${model.name}?`
        + ' All the applications and units included in the model will be'
        + ' destroyed. This action cannot be undone.';
      return (
        <juju.components.Popup
          buttons={buttons}
          title="Destroy model">
          <p>{message}</p>
        </juju.components.Popup>);
    },

    /**
      Makes a request of the controller to delete a selected model.

      @method _destroyModel
    */
    _destroyModel: function() {
      const model = this.state.modelToBeDestroyed;
      const uuid = model.uuid;
      // Hide the confirmation popup.
      this._displayConfirmation(null);
      const xhr = this.props.destroyModels([uuid], this._destroyModelCallback);
      this.xhrs.push(xhr);
    },

    /**
      Callback for the controller delete model call.

      @method _destroyModelCallback
      @param {String} err The error from the request, or null.
      @param {Array} modelList The list of models.
    */
    _destroyModelCallback: function(err, results) {
      const addNotification = this.props.addNotification;
      // Handle global errors.
      if (err) {
        addNotification({
          title: 'Model destruction failed',
          message: 'The model failed to be destroyed: ' + err,
          level: 'error'
        });
        return;
      }
      // Ignore all but the first UUID because the UI only allows deleting one
      // at a time.
      const uuid = Object.keys(results)[0];
      // Check for model-specific errors.
      const uuidError = results[uuid];
      if (uuidError) {
        addNotification({
          title: 'Model destruction failed',
          message: 'The model failed to be destroyed: ' + uuidError,
          level: 'error'
        });
        return;
      }
      // Handle a successful deletion.
      addNotification({
        title: 'Model destroyed',
        message: 'The model is currently being destroyed.',
        level: 'important'
      });
      // XXX kadams54: Ideally the model would change in the DB and that would
      // trigger a re-render. Right now we're getting the data from an API;
      // eventually, once we re-write the model layer to move away from YUI,
      // this will hopefully change to become more React-friendly. Until then
      // this hack will do.
      const destroyedModel = this.state.modelList.find(model => {
        return model.uuid === uuid;
      });
      destroyedModel.isAlive = false;
    },

    /**
      Generate the details for the provided model.

      @method _generateRow
      @param {Object} model A model object.
      @returns {Array} The markup for the row.
    */
    _generateRow: function(model) {
      const props = this.props;
      const uuid = model.uuid;
      const isCurrent = uuid === props.currentModel;
      const classes = classNames(
        'expanding-row',
        'twelve-col',
        'user-profile__entity',
        'user-profile__list-row'
      );
      if (!model.isAlive) {
        if (model.name) {
          return (
            <li className={classes}
              key={uuid}>
              {model.name} is being destroyed.
            </li>);
        } else {
          return null;
        }
      }
      const region = model.region || 'no region';
      let owner = '--';
      // TODO frankban: it's not clear why we should ever miss an owner.
      // Anyway, this logic pre-existed my change.
      if (model.owner) {
        owner = model.owner = model.owner.split('@')[0];
      }
      return (
        <juju.components.UserProfileEntity
          displayConfirmation={this._displayConfirmation.bind(this, model)}
          entity={model}
          expanded={isCurrent}
          key={uuid}
          switchModel={props.switchModel}
          type="model">
          <span className="user-profile__list-col three-col">
            {model.name || '--'}
          </span>
          <span className="user-profile__list-col four-col">
            {model.cloud + '/' + region}
          </span>
          <span className="user-profile__list-col two-col">
            <juju.components.DateDisplay
              date={model.lastConnection || '--'}
              relative={true} />
          </span>
          <span className="user-profile__list-col one-col">
            {model.numMachines}
          </span>
          <span className="user-profile__list-col two-col last-col">
            {owner}
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
            Cloud/Region
          </span>
          <span className="user-profile__list-col two-col">
            Last accessed
          </span>
          <span className="user-profile__list-col one-col">
            Machines
          </span>
          <span className={
            'user-profile__list-col two-col last-col'}>
            Owner
          </span>
        </li>);
    },

    render: function() {
      if (this.state.loadingModels) {
        return (
          <div className="user-profile__model-list twelve-col">
            <juju.components.Spinner />
          </div>
        );
      }
      const props = this.props;
      let createNewButton;
      // XXX kadams54 2016-09-29: ACL check disabled until
      // https://bugs.launchpad.net/juju/+bug/1629089 is resolved.
      //const acl = props.acl;
      //if (acl && acl.canAddModels()) {
      if (props.userInfo.isCurrent) {
        createNewButton = (
          <juju.components.CreateModelButton
            changeState={props.changeState}
            switchModel={props.switchModel} />
        );
      }
      //}
      const list = this.state.modelList;
      let content;
      if (list && list.length > 0) {
        const rows = list.map(this._generateRow);
        content = (
          <ul className="user-profile__list twelve-col">
            {this._generateHeader()}
            {rows}
          </ul>
        );
      }
      let label = 'Models';
      if (!props.userInfo.isCurrent) {
        label = 'Models shared with you';
      }
      return (
        <div className="user-profile__model-list">
          <div className="user-profile__header twelve-col no-margin-bottom">
            <div className="left">
              {label}
              <span className="user-profile__size">
                ({list.length})
              </span>
            </div>
            <div className="right">
              {createNewButton}
            </div>
          </div>
          {content}
          {this._generateConfirmation()}
        </div>
      );
    }

  });

}, '', {
  requires: [
    'create-model-button',
    'date-display',
    'generic-button',
    'generic-input',
    'loading-spinner',
    'popup',
    'user-profile-entity'
  ]
});

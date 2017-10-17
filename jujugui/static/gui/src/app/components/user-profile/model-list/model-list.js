/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const CreateModelButton = require('../../create-model-button/create-model-button');
const DateDisplay = require('../../date-display/date-display');
const Popup = require('../../popup/popup');
const Spinner = require('../../spinner/spinner');
const UserProfileEntity = require('../entity/entity');

class UserProfileModelList extends React.Component {
  constructor() {
    super();
    this.state = {
      destroyingModels: [],
      loadingModels: false
    };
  }

  componentWillMount() {
    this._fetchModels(this.props.facadesExist);
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;
    if (
      props.userInfo.profile !== nextProps.userInfo.profile ||
      props.facadesExist !== nextProps.facadesExist
    ) {
      this._fetchModels(nextProps.facadesExist);
    }
  }

  /**
    Makes a request of the controller to fetch the user's availble models.

    @method _fetchModels
    @param {Boolean} facadesExist - Whether the controller is
      connected or not.
  */
  _fetchModels(facadesExist) {
    if (!facadesExist) {
      console.warn('Controller not connected, skipping fetching models.');
      return;
    }
    // Delay the call until after the state change to prevent race
    // conditions.
    this.setState({loadingModels: true}, () => {
      this.props.listModelsWithInfo(this._fetchModelsCallback.bind(this));
    });
  }

  /**
    Callback for the controller list models call.

    @method _fetchModelsCallback
    @param {String} err The error from the request, or null.
    @param {Array} modelList The list of models.
  */
  _fetchModelsCallback(err, modelList) {
    this.setState({loadingModels: false}, () => {
      if (err) {
        const message = 'Cannot load models';
        console.error(message, err);
        this.props.addNotification({
          title: message,
          message: `${message}: ${err}`,
          level: 'error'
        });
        return;
      }
      if (!this.props.userInfo.isCurrent) {
        const extUser = this.props.userInfo.external + '@external';
        modelList = modelList.filter(model => {
          return model.owner === extUser;
        });
      }
      this.props.setEntities(modelList || []);
    });
  }

  /**
    Display the confirmation for destroying a model.

    @method _displayConfirmation
    @param {Object} model the model to destroy. A model should at least have
                          a name and uuid.
  */
  _displayConfirmation(model) {
    this.setState({modelToBeDestroyed: model});
  }

  /**
    Generate the confirmation for destroying a model.

    @method _displayConfirmation
    @return {Object} the confirmation component.
  */
  _generateConfirmation() {
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
      type: 'inline-neutral'
    }, {
      title: 'Destroy',
      action: this._destroyModel.bind(this),
      type: 'destructive'
    }];
    const message = `Are you sure you want to destroy ${model.name}?`
      + ' All the applications and units included in the model will be'
      + ' destroyed. This action cannot be undone.';
    return (
      <Popup
        buttons={buttons}
        title="Destroy model">
        <p>{message}</p>
      </Popup>);
  }

  /**
    Makes a request of the controller to delete a selected model.

    @method _destroyModel
  */
  _destroyModel() {
    const model = this.state.modelToBeDestroyed;
    const uuid = model.uuid;
    // Hide the confirmation popup.
    this._displayConfirmation(null);
    // Add the model to the list of models being destroyed, then make the
    // actual API call. The API call is in a callback to avoid race
    // conditions.
    this.setState({
      destroyingModels: this.state.destroyingModels.concat([uuid])
    }, () => {
      const callback = this._destroyModelCallback.bind(
        this, uuid, model.name);
      this.props.destroyModels([uuid], callback);
    });
  }

  /**
    Callback for the controller delete model call.

    @method _destroyModelCallback
    @param {String} uuid the model being deleted. Bound when the callback is
      passed into the API call.
    @param {String} modelName the name of the model being deleted; primarily
      useful for providing user-friendly notifications messages. Bound when
      the callback is passed into the API call.
    @param {String} err The error from the request, or null.
    @param {Object} results The result for the model being deleted. The
      object is keyed to the model UUID.
  */
  _destroyModelCallback(uuid, modelName, err, results) {
    const addNotification = this.props.addNotification;
    // Handle global errors or model-specific errors.
    const error = err || results[uuid];
    if (error) {
      addNotification({
        title: 'Model destruction failed',
        message: `Could not destroy model "${modelName}": ${error}`,
        level: 'error'
      });
    } else {
      // Handle a successful deletion.
      addNotification({
        title: 'Model destroyed',
        message: `The model "${modelName}" is destroyed.`,
        level: 'important'
      });
      // XXX kadams54: Ideally the model would change in the DB and that would
      // trigger a re-render. Right now we're getting the data from an API;
      // eventually, once we re-write the model layer to move away from YUI,
      // this will hopefully change to become more React-friendly. Until then
      // this hack will do.
      const destroyedModel = this.props.models.find(model => {
        return model.uuid === uuid;
      });
      destroyedModel.isAlive = false;
    }
    // Remove the model UUID from the list of in-flight deletion requests.
    const destroyingModels = this.state.destroyingModels.filter(id => {
      return id !== uuid;
    });
    this.setState({
      destroyingModels: destroyingModels
    });
  }

  /**
    Generate the details for the provided model.

    @method _generateRow
    @param {Object} model A model object.
    @returns {Array} The markup for the row.
  */
  _generateRow(model) {
    const props = this.props;
    const uuid = model.uuid;
    const isCurrent = uuid === props.currentModel;
    const classes = classNames(
      'expanding-row',
      'twelve-col',
      'user-profile__entity',
      'user-profile__list-row'
    );
    // Hide any models that are destroyed.
    if (!model.isAlive) {
      return null;
    }
    // Note any model destruction requests that are in-flight.
    if (this.state.destroyingModels.indexOf(uuid) >= 0) {
      if (model.name) {
        return (
          <li className={classes}
            key={uuid}>
            Requesting that {model.name} be destroyed.
          </li>
        );
      } else {
        return null;
      }
    }
    // See the _generateModelInfo function in entity.js for matching logic.
    // Both sections should be kept roughly in sync.
    const region = model.region || 'no region';
    let owner = '--';
    // TODO frankban: it's not clear why we should ever miss an owner.
    // Anyway, this logic pre-existed my change.
    if (model.owner) {
      owner = model.owner.split('@')[0];
    }

    const modelUser = model.users ? model.users.filter(user => {
      return user.displayName === props.userInfo.profile;
    }) : null;

    // This is purely defensive and we should always know a permission
    // if you ever see this, sound the alarms.
    let permission = 'unknown';
    if (modelUser.length) {
      permission = modelUser[0].access;
    }

    return (
      <UserProfileEntity
        acl={props.acl}
        addNotification={this.props.addNotification}
        displayConfirmation={this._displayConfirmation.bind(this, model)}
        entity={model}
        expanded={isCurrent}
        key={uuid}
        switchModel={props.switchModel}
        permission={permission}
        type="model">
        <span className="user-profile__list-col two-col">
          {model.name || '--'}
        </span>
        <span className="user-profile__list-col two-col">
          {owner}
        </span>
        <span className="user-profile__list-col two-col">
          {model.numMachines}
        </span>
        <span className="user-profile__list-col two-col">
          {model.cloud + '/' + region}
        </span>
        <span className="user-profile__list-col two-col">
          {permission}
        </span>
        <span className="user-profile__list-col two-col last-col">
          <DateDisplay
            date={model.lastConnection || '--'}
            relative={true} />
        </span>
      </UserProfileEntity>);
  }

  /**
    Generate the header for the models.

    @method _generateHeader
    @returns {Array} The markup for the header.
  */
  _generateHeader() {
    return (
      <li className="user-profile__list-header twelve-col">
        <span className="user-profile__list-col two-col">
          Name
        </span>
        <span className="user-profile__list-col two-col">
          Owner
        </span>
        <span className="user-profile__list-col two-col">
          Machines
        </span>
        <span className="user-profile__list-col two-col">
          Cloud/Region
        </span>
        <span className="user-profile__list-col two-col">
          Permission
        </span>
        <span className={
          'user-profile__list-col two-col last-col'}>
          Last accessed
        </span>
      </li>);
  }

  render() {
    if (this.state.loadingModels) {
      return (
        <div className="user-profile__model-list twelve-col">
          <Spinner />
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
        <CreateModelButton
          changeState={props.changeState}
          switchModel={props.switchModel} />
      );
    }
    //}
    const list = this.props.models || [];
    let content;
    if (list && list.length > 0) {
      const rows = list.map(this._generateRow.bind(this));
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
};

UserProfileModelList.propTypes = {
  acl: PropTypes.object,
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  currentModel: PropTypes.string,
  destroyModels: PropTypes.func.isRequired,
  facadesExist: PropTypes.bool.isRequired,
  listModelsWithInfo: PropTypes.func.isRequired,
  models: PropTypes.array,
  setEntities: PropTypes.func.isRequired,
  switchModel: PropTypes.func.isRequired,
  // userInfo must have the following attributes:
  // - external: the external user name to use for retrieving data, for
  //   instance, from the charm store. Might be null if the user is being
  //   displayed for the current user and they are not authenticated to
  //   the charm store;
  // - isCurrent: whether the profile is being displayed for the currently
  //   authenticated user;
  // - profile: the user name for whom profile details must be displayed.
  userInfo: PropTypes.object.isRequired
};

module.exports = UserProfileModelList;

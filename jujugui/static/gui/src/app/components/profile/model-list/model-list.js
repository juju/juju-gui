/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const BasicTable = require('../../basic-table/basic-table');
const CreateModelButton = require('../../create-model-button/create-model-button');
const DateDisplay = require('../../date-display/date-display');
const Popup = require('../../popup/popup');
const Spinner = require('../../spinner/spinner');
const SvgIcon = require('../../svg-icon/svg-icon');

/**
  Model list React component used to display a list of the users models in
  their profile.
*/
class ProfileModelList extends React.Component {
  constructor() {
    super();
    this.state = {
      loadingModels: false,
      models: null,
      notification: null
    };
  }

  componentWillMount() {
    this._fetchModels(this.props.facadesExist);
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;
    if (props.userInfo.profile !== nextProps.userInfo.profile ||
        props.facadesExist !== nextProps.facadesExist) {
      this._fetchModels(nextProps.facadesExist);
    }
  }

  /**
    Makes a request of the controller to fetch the user's availble models.
    @param {Boolean} facadesExist Whether the controller is connected or not.
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
    Callback for the controller listModelsWithInfo call.
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
      this.setState({models: modelList});
    });
  }

  /**
    Shows the confirmation modal for destroying a model.
    @param {Object} model The model data.
  */
  _showConfirmation(model) {
    const buttons = [{
      title: 'Cancel',
      action: () => this.setState({notification: null}),
      type: 'inline-neutral'
    }, {
      title: 'Destroy',
      action: () => {
        this.setState({notification: null});
        this.props.destroyModels([model.uuid], () => {
          this._fetchModels(this.props.facadesExist);
        });
      },
      type: 'destructive'
    }];
    const message = `Are you sure you want to destroy ${model.name}?`
      + ' All the applications and units included in the model will be'
      + ' destroyed. This action cannot be undone.';
    this.setState({
      notification: (
        <Popup
          buttons={buttons}
          title="Destroy model">
          <p>{message}</p>
        </Popup>)
    });
  }

  /**
    Calls to destroy the supplied model.
    @param {Object} model The model object.
    @param {String} bdRef The ref index of the button dropdown component.
    @param {Object} e The click event.
  */
  _destroyModel(model, bdRef, e) {
    e.preventDefault();
    e.stopPropagation();
    if (model.isController) {
      this.props.addNotification({
        title: 'Cannot destroy model',
        message: 'The controller model cannot be destroyed.',
        level: 'error'
      });
      return;
    }
    this._showConfirmation(model);
  }

  /**
    Generates the list of models that are owned by the active user.
    @return {Object} The model list as JSX.
  */
  _generateModels() {
    const models = this.state.models || [];
    const rowData = models.reduce((modelList, model, index) => {
      // Keep only the models that aren't currently in the destroy cycle.
      if (!model.isAlive) {
        return modelList;
      }
      const bdRef = `mymodel-button-dropdown-${index}`;
      const owner = model.owner.replace('@external', '') || this.props.userInfo.profile;
      const path = `${this.props.baseURL}u/${owner}/${model.name}`;
      let adminUser;
      let profileUser;
      model.users.some(user => {
        if (user.access === 'admin') {
          adminUser = user;
        }
        if (user.displayName === this.props.userInfo.profile) {
          profileUser = user;
        }
        // We've got all the info we need, exit the loop.
        if (adminUser && profileUser) {
          return true;
        }
      });
      const icons = new Map([
        ['read', 'show_16'],
        ['write', 'edit_16'],
        ['admin', 'user_16']
      ]);
      const userIsAdmin = profileUser.access === 'admin';
      const username = userIsAdmin ? 'Me' : adminUser.displayName;
      modelList.push({
        columns: [{
          content: (
            <a href={path}
              onClick={this.switchToModel.bind(this, {
                name: model.name,
                id: model.id,
                owner
              })}>
              {model.name}
            </a>),
          columnSize: 3
        }, {
          content: `${model.numMachines} ${model.provider.toUpperCase()}/` +
            model.region.toUpperCase(),
          columnSize: 3
        }, {
          content: (
            <div>
              <SvgIcon name={icons.get(profileUser.access)}
                size="16" />
              <span className="profile-model-list__username">
                {username}
              </span>
            </div>),
          columnSize: 3
        }, {
          content: (
            <DateDisplay
              date={model.lastConnection || '--'}
              relative={true} />),
          columnSize: 2
        }, {
          content: userIsAdmin ? (
            <a onClick={this._destroyModel.bind(this, model, bdRef)}>
              <SvgIcon name="delete_16"
                size="16" />
            </a>) : null,
          columnSize: 1
        }],
        key: model.name
      });
      return modelList;
    }, []) || [];
    return (
      <div>
        <div className="profile-model-list__header twelve-col">
          <CreateModelButton
            title="Start a new model"
            changeState={this.props.changeState}
            switchModel={this.props.switchModel} />
          <span className="profile-model-list__header-title">
            My models ({rowData.length})
          </span>
        </div>
        {!rowData.length ? null : <BasicTable
          headers={[{
            content: 'Name',
            columnSize: 3
          }, {
            content: 'Machines, cloud/region',
            columnSize: 3
          }, {
            content: 'Permissions/owner',
            columnSize: 3
          }, {
            content: 'Last accessed',
            columnSize: 2
          }, {
            content: '',
            columnSize: 1
          }]}
          rows={rowData} />}
      </div>);
  }

  /**
    Call the switchModel prop to switch a model passing it the necessary
    model data. Prevents default and propagation.
    @param {Object} model The model data necessary for the switchModel call.
    @param {Object} e The click event.
  */
  switchToModel(model, e) {
    e.preventDefault();
    e.stopPropagation(); // Required to avoid react error about root DOM node.
    this.props.switchModel(model);
  }

  _generateNotification() {
    if (!this.state.notification) {
      return;
    }
    return this.state.notification;
  }

  render() {
    let content;
    if (this.state.loadingModels) {
      content = (<Spinner />);
    } else {
      content = (
        <div>
          {this._generateModels()}
          {this._generateNotification()}
        </div>);
    }
    return (
      <div className="profile-model-list">
        {content}
      </div>);
  }

};

ProfileModelList.propTypes = {
  acl: PropTypes.object,
  addNotification: PropTypes.func.isRequired,
  baseURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  destroyModels: PropTypes.func.isRequired,
  facadesExist: PropTypes.bool.isRequired,
  listModelsWithInfo: PropTypes.func.isRequired,
  models: PropTypes.array,
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

module.exports = ProfileModelList;

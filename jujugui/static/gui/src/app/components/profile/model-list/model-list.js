/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

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
      // Split the models into ones owned by the active user and ones
      // shared to the active user.
      const models = {
        owned: [],
        shared: []
      };
      modelList.forEach(model => {
        if (model.owner === `${this.props.userInfo.profile}@external`) {
          models.owned.push(model);
        } else {
          models.shared.push(model);
        }
      });
      this.setState({models});
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
        <juju.components.Popup
          buttons={buttons}
          title="Destroy model">
          <p>{message}</p>
        </juju.components.Popup>)
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
    this.refs[bdRef]._toggleDropdown();
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
  _generateMyModels() {
    const key = 'mymodels';
    const headerLabel = 'My models';
    const labels = [
      'Name', 'Machines, Cloud/region', 'Last accessed', 'Action'];
    const tableHeader = this._generateTableHeader(labels, key);
    const state = this.state.models;
    const modelList = state && state.owned;
    if (!modelList || modelList.length === 0) {
      return [this._generateHeader(headerLabel, 0, true), tableHeader];
    }
    const rowData = modelList.reduce((models, model, index) => {
      // Keep only the models that aren't currently in the destroy cycle.
      if (!model.isAlive) {
        return;
      }
      const bdRef = `mymodel-button-dropdown-${index}`;
      models.push({
        id: model.id,
        name: model.name,
        provider: `${model.numMachines} ${model.provider.toUpperCase()}/${model.region.toUpperCase()}`, // eslint-disable-line max-len
        lastConnection: model.lastConnection,
        action: (
          <juju.components.ButtonDropdown
            ref={bdRef}
            listItems={[
              <li
                className="dropdown-menu__list-item" role="menuitem" tabIndex="0"
                key="delete">
                <a
                  className="dropdown-menu__list-item-link"
                  onClick={this._destroyModel.bind(this, model, bdRef)}>
                  Delete
                </a>
              </li>
            ]}
            tooltip="more"
            icon="contextual-menu-16" />)
      });
      return models;
    }, []);
    const rows = this._generateRows(
      rowData, ['name', 'provider', 'lastConnection', 'action']);
    return (
      <ul className="profile-model-list__list">
        {[
          this._generateHeader(headerLabel, rowData.length, true),
          tableHeader,
          ...rows
        ]}
      </ul>);
  }

  /**
    Generates the list of models that are owned by another user but shared
    with the active user.
    @return {Object} The model list as JSX.
  */
  _generateSharedModels() {
    const key = 'sharedmodels';
    const headerLabel = 'Models shared with me';
    const labels = [
      'Name', 'Machines, Cloud/region', 'Permissions', 'Owner'];
    const tableHeader = this._generateTableHeader(labels, key);
    const state = this.state.models;
    const modelList = state && state.shared;
    if (!modelList || modelList.length === 0) {
      return [this._generateHeader(headerLabel, 0), tableHeader];
    }
    const rowData = modelList.reduce((models, model) => {
      // Keep only the models that aren't currently in the destroy cycle.
      if (!model.isAlive) {
        return;
      }
      // Get the model users permissions
      const modelUser = model.users ? model.users.filter(user =>
        user.displayName === this.props.userInfo.profile) : null;
      models.push({
        id: model.id,
        name: model.name,
        provider: `${model.numMachines} ${model.provider.toUpperCase()}/${model.region.toUpperCase()}`, // eslint-disable-line max-len
        access: modelUser.length && modelUser[0].access,
        owner: model.owner.replace('@external', '')
      });
      return models;
    }, []);
    const rows = this._generateRows(rowData, ['name', 'provider', 'access', 'owner']);
    return (
      <ul className="profile-model-list__list">
        {[
          this._generateHeader(headerLabel, rowData.length),
          tableHeader,
          ...rows
        ]}
      </ul>);
  }

  /**
    Generates the JSX markup for the model list header.
    @param {String} label The content for the header
    @param {Boolean} showCreate Whether it should show the "Create New" button.
    @param {Integer} modelCount The number of rows in the model table.
    @return {Object} The model list header as JSX markup.
  */
  _generateHeader(label, modelCount, showCreate=false) {
    const props = this.props;
    return (
      <li className="profile-model-list__header" key={label}>
        <span className="profile-model-list__header-title">
          {`${label} (${modelCount})`}
        </span>
        {showCreate ?
          <juju.components.CreateModelButton
            title="Start a new model"
            changeState={props.changeState}
            switchModel={props.switchModel} /> : null}
      </li>);
  }

  /**
    Generates the JSX markup for the model list table header.
    @param {Array} labels An array of labels required to generate the header.
    @param {String} key The key for react lists.
    @return {Object} The model list header as JSX markup.
  */
  _generateTableHeader(labels, key) {
    return (
      <li className="profile-model-list__table-header" key={key}>
        {labels.map(label => <span key={label}>{label}</span>)}
      </li>);
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

  /**
    Generate the JSX markup for a row of model data.
    @param {Map} rowData The data to display.
    @param {Array} columns The columns that the supplied data is to be sorted into
    @return {Array} The model list rows as JSX markup.
  */
  _generateRows(rows, columns) {
    function processData(data, label) {
      switch(label) {
        case 'lastConnection':
          return <juju.components.DateDisplay date={data[label] || '--'} relative={true} />;
          break;
        case 'name':
          const owner = data.owner || this.props.userInfo.profile;
          const name = data.name;
          const path = `${this.props.baseURL}u/${owner}/${name}`;
          return <a href={path} onClick={this.switchToModel.bind(this, {
            name,
            id: data.id,
            owner
          })} >{data.name}</a>;
          break;
        default:
          return data[label];
      }
    }

    return (
      rows.map((rowData, idx) =>
        <li className="profile-model-list__row" key={idx}>
          {columns.map(label =>
            <span key={`${label}-${idx}`}>{processData.call(this, rowData, label)}</span>)}
        </li>));
  }

  _generateNotification() {
    if (!this.state.notification) {
      return;
    }
    return this.state.notification;
  }

  render() {
    return (
      <div className="profile-model-list">
        {this._generateMyModels()}
        {this._generateSharedModels()}
        {this._generateNotification()}
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

YUI.add('profile-model-list', function() {
  juju.components.ProfileModelList = ProfileModelList;
}, '', {
  requires: [
    'button-dropdown',
    'create-model-button',
    'date-display',
    'popup'
  ]
});

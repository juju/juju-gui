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
      models: null
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
    Callback for the controller listModels call.
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
    Generates the list of models that are owned by the active user.
    @return {Object} The model list as JSX.
  */
  _generateMyModels() {
    const key = 'mymodels';
    const headerLabel = 'My models';
    const labels = [
      'Name', 'Machines, Cloud/region', 'last accessed', 'action'];
    const tableHeader = this._generateTableHeader(labels, key);
    const state = this.state.models;
    const modelList = state && state.owned;
    if (!modelList || modelList.length === 0) {
      return [this._generateHeader(headerLabel, 0, true), tableHeader];
    }
    const rowData = modelList.reduce((models, model) => {
      // Keep only the models that aren't currently in the destroy cycle.
      if (!model.isAlive) {
        return;
      }
      models.push([
        model.name,
        `${model.numMachines} ${model.provider.toUpperCase()}/${model.region.toUpperCase()}`, // eslint-disable-line max-len
        model.lastConnection,
        '-'
      ]);
      return models;
    }, []);
    const rows = this._generateRows(rowData, key);
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
      models.push([
        model.name,
        `${model.numMachines} ${model.provider.toUpperCase()}/${model.region.toUpperCase()}`, // eslint-disable-line max-len
        modelUser.length && modelUser[0].access,
        model.owner.replace('@external', '')
      ]);
      return models;
    }, []);
    const rows = this._generateRows(rowData, key);
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
      <li className="profile-model-list__header">
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
    Generate the JSX markup for a row of model data.
    @param {Map} rowData The data to display.
    @param {String} key The key for react lists.
    @return {Array} The model list rows as JSX markup.
  */
  _generateRows(rows, key) {
    function processData(data) {
      if (data instanceof Date) {
        return <juju.components.DateDisplay date={data || '--'} relative={true} />; // eslint-disable-line max-len
      }
      return data;
    }

    return (
      rows.map((row, idx) =>
        <li className="profile-model-list__row" key={`${key}-${idx}`}>
          {row.map((data, idx) =>
            <span key={`${key}-span-${idx}`}>{processData(data)}</span>)}
        </li>));
  }

  render() {
    return (
      <div className="profile-model-list">
        {this._generateMyModels()}
        {this._generateSharedModels()}
      </div>);
  }

};

ProfileModelList.propTypes = {
  acl: React.PropTypes.object,
  addNotification: React.PropTypes.func.isRequired,
  changeState: React.PropTypes.func.isRequired,
  destroyModels: React.PropTypes.func.isRequired,
  facadesExist: React.PropTypes.bool.isRequired,
  listModelsWithInfo: React.PropTypes.func.isRequired,
  models: React.PropTypes.array,
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
};

YUI.add('profile-model-list', function() {
  juju.components.ProfileModelList = ProfileModelList;
}, '', {
  requires: [
    'create-model-button',
    'date-display'
  ]
});

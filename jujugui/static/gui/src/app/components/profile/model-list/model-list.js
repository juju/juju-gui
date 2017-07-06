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
      if (!this.props.userInfo.isCurrent) {
        const extUser = this.props.userInfo.external + '@external';
        modelList = modelList.filter(model => {
          return model.owner === extUser;
        });
      }
      this.setState({models: modelList || []});
    });
  }

  _generateMyModels() {}

  _generateSharedModels() {}

  _generateHeader() {}

  _generateRow() {}

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
  currentModel: React.PropTypes.string,
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
  requires: []
});

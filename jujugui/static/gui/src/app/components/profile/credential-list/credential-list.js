/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const GenericButton = require('../../generic-button/generic-button');

class ProfileCredentialList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      credentialMap: null
    };
  }

  async componentWillMount() {
    const props = this.props;
    try {
      const clouds = await this._listClouds();
      const credentialMap = await this._getCloudCredentialNames(props.username, clouds);
      const credentialToModel = await this._fetchAndFilterModelsByCredential();
      credentialToModel.forEach((modelNames, credentialKey) =>
        credentialMap.get(credentialKey).models = modelNames);
      this.setState({credentialMap});
    } catch (error) {
      const msg = 'Unable to fetch credential data';
      props.addNotification({
        title: msg,
        message: msg,
        level: 'error'
      });
      console.error(msg, error);
    }
  }

  /**
    List the clouds available to the current user.
    @returns {Promise} Resolves to an array of cloud names.
  */
  _listClouds() {
    return new Promise((resolve, reject) => {
      this.props.controllerAPI.listClouds((error, clouds) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(Object.keys(clouds));
      });
    });
  }

  /**
    Requests the cloud names for the supplied clouds
    @param {String} username The username on the controller.
    @param {Array} clouds An array of cloud names to fetch the credentials for.
    @returns {Promise} Resolves to a Map of credential data with the key being
      the credential key.
  */
  _getCloudCredentialNames(username, clouds) {
    return new Promise((resolve, reject) => {
      this.props.controllerAPI.getCloudCredentialNames(
        clouds.map(cloudName => [username, cloudName]),
        (error, namesData) => {
          if (error) {
            reject(error);
            return;
          }
          const credentials = new Map();
          Object.values(namesData).forEach(data => {
            data.names.forEach((name, index) => {
              credentials.set(name, {
                cloud: name.split('_')[0],
                displayName: data.displayNames[index]
              });
            });
          });
          resolve(credentials);
        });
    });
  }

  /**
    List the models that the current user has access to with information.
    @returns {Promise} Resolves to the model data sorted by credential key.
  */
  _fetchAndFilterModelsByCredential() {
    const props = this.props;
    return new Promise((resolve, reject) => {
      props.controllerAPI.listModelsWithInfo((error, modelData) => {
        if (error) {
          reject(error);
          return;
        }
        const sorted = new Map();
        modelData
          .filter(model => model.owner === props.username)
          .forEach(model => {
            const key = model.credential;
            const modelName = model.name;
            sorted.has(key) ?
              sorted.get(key).push(modelName) :
              sorted.set(key, [modelName]);
          });
        resolve(sorted);
      });
    });
  }

  render() {
    let addButton = (
      <GenericButton>Add credentials</GenericButton>);
    let credentials = 0;
    return (
      <div className="profile-credential-list">
        <div className="twelve-col">
          {addButton}
          <h2 className="profile__title">
            My credentials
            <span className="profile__title-count">
              ({credentials ? credentials.length : 0})
            </span>
          </h2>
        </div>
      </div>
    );
  }
}

ProfileCredentialList.propTypes = {
  addNotification: PropTypes.func.isRequired,
  controllerAPI: shapeup.shape({
    getCloudCredentialNames: PropTypes.func.isRequired,
    listClouds: PropTypes.func.isRequired,
    listModelsWithInfo: PropTypes.func.isRequired
  }),
  username: PropTypes.string.isRequired
};

module.exports = ProfileCredentialList;

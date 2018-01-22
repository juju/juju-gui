/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const BasicTable = require('../../basic-table/basic-table');
const GenericButton = require('../../generic-button/generic-button');
const Spinner = require('../../spinner/spinner');

class ProfileCredentialList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      credentialMap: new Map(),
      loading: true
    };
  }

  async componentDidMount() {
    const props = this.props;
    try {
      const clouds = await this._listClouds();
      const credentialMap = await this._getCloudCredentialNames(props.username, clouds);
      const credentialToModel = await this._fetchAndFilterModelsByCredential();
      credentialToModel.forEach((modelNames, credentialKey) =>
        credentialMap.get(credentialKey).models = modelNames);
      this.setState({
        credentialMap,
        loading: false
      });
    } catch (error) {
      this.setState({loading: false});
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

  /**
    Creates the JSX content for the credential list.
    @return {Object} The credential UI JSX.
  */
  _generateCredentialsList() {
    const state = this.state;
    const credentials = state.credentialMap;
    if (state.loading) {
      return (<Spinner />);
    }
    if (credentials.size === 0) {
      return (<div>No credentials available</div>);
    }
    let rows = [];
    const selectedCredential = this.props.credential;

    credentials.forEach((credential, key) => {
      rows.push({
        classes: key === selectedCredential ? ['profile-credential-list--highlighted'] : null,
        columns: [{
          content: credential.displayName,
          columnSize: 6
        }, {
          content: credential.cloud,
          columnSize: 2
        }, {
          content: function() {
            const models = credential.models;
            const modelCount = models ? models.length : 0;
            switch(modelCount) {
              case 0:
                return '-';
                break;
              case 1:
                return `${credential.models[0]}`;
                break;
              default:
                return `${modelCount} Models`;
            }
          }(),
          columnSize: 2
        }, {
          content: '...',
          columnSize: 1
        }],
        key
      });
    });

    return (
      <BasicTable
        headerClasses={['profile__entity-table-header-row']}
        headerColumnClasses={['profile__entity-table-header-column']}
        headers={[{
          content: 'Name',
          columnSize: 6
        }, {
          content: 'Provider',
          columnSize: 2
        }, {
          content: 'Used by',
          columnSize: 3
        }, {
          content: 'Action',
          columnSize: 1
        }]}
        rowClasses={['profile__entity-table-row']}
        rowColumnClasses={['profile__entity-table-column']}
        rows={rows} />
    );
  }

  render() {
    let addButton = (
      <GenericButton>Add credentials</GenericButton>);
    return (
      <div className="profile-credential-list">
        <div className="four-col">
          <h2 className="profile__title">
            My credentials
            <span className="profile__title-count">
              ({this.state.credentialMap.size})
            </span>
          </h2>
        </div>
        <div className="seven-col">
          {addButton}
        </div>
        {this._generateCredentialsList()}
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
  credential: PropTypes.string,
  username: PropTypes.string.isRequired
};

module.exports = ProfileCredentialList;

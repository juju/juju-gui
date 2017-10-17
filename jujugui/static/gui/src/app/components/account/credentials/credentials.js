/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../../button-row/button-row');
const DeploymentCloud = require('../../deployment-flow/cloud/cloud');
const DeploymentCredentialAdd = require('../../deployment-flow/credential/add/add');
const ExpandingRow = require('../../expanding-row/expanding-row');
const GenericButton = require('../../generic-button/generic-button');
const Popup = require('../../popup/popup');
const Spinner = require('../../spinner/spinner');

// Define the name of the lxd cloud.
const LOCAL_CLOUD = 'localhost';

// List, add and remove cloud credentials in the account page.
class AccountCredentials extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      cloud: null,
      clouds: [],
      credentials: [],
      loading: false,
      editCredential: null,
      removeCredential: null,
      showAdd: false
    };
  }

  componentWillMount() {
    this._getClouds();
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Retrieve the list of clouds.

    @method _getClouds
  */
  _getClouds() {
    this.setState({loading: true}, () => {
      const xhr = this.props.listClouds((error, clouds) => {
        if (error) {
          const message = 'Unable to list clouds';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        // Add the cloud name into the clouds object so it can be used
        // by other components.
        Object.keys(clouds).forEach(name => clouds[name].name = name);
        this._getCloudCredentialNames(clouds);
      });
      this.xhrs.push(xhr);
    });
  }

  /**
    Retrieve the list of credential names for the user.

    @method _getCloudCredentialNames
    @param {Array} clouds A list of cloud ids.
  */
  _getCloudCredentialNames(clouds) {
    const pairs = Object.keys(clouds).map(cloud => {
      return [this.props.username, cloud];
    });
    const xhr = this.props.getCloudCredentialNames(
      pairs, (error, names) => {
        if (error) {
          const message = 'Unable to get names for credentials';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        let credentials = [];
        names.forEach((cloud, i) => {
          cloud.displayNames.forEach((name, j) => {
            credentials.push({
              id: cloud.names[j],
              name: name,
              // Store the cloud for this name.
              cloud: pairs[i][1]
            });
          });
        });
        this.setState({
          clouds: clouds,
          credentials: credentials,
          loading: false
        });
      });
    this.xhrs.push(xhr);
  }

  /**
    Handle deleting a credential.
    @param credential {String} A credential id.
  */
  _handleDeleteCredential(credential = null) {
    this.setState({removeCredential: credential});
  }

  /**
    Sets the state for editCredential using the supplied credentialId.
    @param {String} credentialId The credential ID to edit.
  */
  _handleEditCredential(credentialId = null) {
    this.setState({editCredential: credentialId});
  }

  /**
    Handle deleting a credential.

    @param credential {String} A credential id.
  */
  _generateDeleteCredential(credential) {
    if (!this.state.removeCredential) {
      return null;
    }
    const buttons = [{
      title: 'Cancel',
      action: this._handleDeleteCredential.bind(this),
      type: 'inline-neutral'
    }, {
      title: 'Continue',
      action: this._deleteCredential.bind(this),
      type: 'destructive'
    }];
    return (
      <Popup
        buttons={buttons}
        title="Remove credentials">
        <p>
          Are you sure you want to remove these credentials?
        </p>
      </Popup>);
  }

  /**
    Handle deleting a credential.

    @method _deleteCredential
  */
  _deleteCredential() {
    const credential = this.state.removeCredential;
    const xhr = this.props.revokeCloudCredential(credential, (error) => {
      if (error) {
        const message = 'Unable to revoke the cloud credential';
        this.props.addNotification({
          title: message,
          message: `${message}: ${error}`,
          level: 'error'
        });
        console.error(message, error);
        return;
      }
      // Remove the credential from the list.
      const credentials = this.state.credentials.filter(cred => {
        if (cred.id !== credential) {
          return true;
        }
      });
      this.setState({
        credentials: credentials,
        removeCredential: null});
    });
    this.xhrs.push(xhr);
  }

  /**
    Generate a list of credentials.

    @method _generateCredentials
  */
  _generateCredentials() {
    const credentials = this.state.credentials;
    if (this.state.loading) {
      return (
        <Spinner />);
    }
    const credentialsList = credentials.map(credential => {
      const cloud = this.props.getCloudProviderDetails(credential.cloud);
      const title = cloud ? cloud.title : credential.cloud;
      const buttons = [{
        title: 'Remove',
        type: 'neutral',
        disabled: credential.cloud === LOCAL_CLOUD,
        action: this._handleDeleteCredential.bind(this, credential.id)
      }, {
        title: 'Edit',
        type: 'neutral',
        disabled: credential.cloud === LOCAL_CLOUD,
        action: this._handleEditCredential.bind(this, credential.id)
      }];
      return (
        <li className="user-profile__list-row twelve-col"
          key={credential.id}>
          <span className="six-col user-profile__list-col">
            {credential.name}
          </span>
          <span className="three-col user-profile__list-col">
            {title}
          </span>
          <span className="three-col last-col user-profile__list-col no-margin-bottom">
            <ButtonRow buttons={buttons}/>
          </span>
          {this._generateEditCredentials(credential)}
        </li>);
    });
    if (credentialsList.length > 0) {
      return (
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="six-col user-profile__list-col">
              Name
            </span>
            <span className="six-col last-col user-profile__list-col">
              Provider
            </span>
          </li>
          {credentialsList}
        </ul>);
    } else {
      return (
        <div>
          No credentials available.
        </div>);
    }
  }

  /**
    Show the add credentials form.

    @method _toggleAdd
  */
  _toggleAdd() {
    // The cloud needs to be reset so that when the form is shown it doesn't
    // show the last selected cloud.
    this.setState({showAdd: !this.state.showAdd, cloud: null});
  }

  /**
    Store the selected cloud in state.

    @method _setCloud
    @param {String} cloud The selected cloud.
  */
  _setCloud(cloud) {
    this.setState({cloud: cloud});
  }

  /**
    Store the selected credential in state.

    @method _setCredential
    @param {String} credential The selected credential.
  */
  _setCredential(credential) {
    this.setState({credential: credential});
  }

  /**
    Generate a form to add credentials.

    @method _generateAddCredentials
  */
  _generateAddCredentials() {
    let content = null;
    let addForm = null;
    let chooseCloud = null;
    if (this.state.showAdd && this.state.cloud) {
      addForm = this._generateDeploymentCredentialAdd();
      chooseCloud = (
        <div className="account__credentials-choose-cloud">
          <GenericButton
            action={this._setCloud.bind(this, null)}
            type="inline-neutral">
            Change cloud
          </GenericButton>
        </div>);
    }
    if (this.state.showAdd) {
      content = (
        <div>
          {chooseCloud}
          {this._generateDeploymentCloud()}
          {addForm}
        </div>);
    }
    return (
      <ExpandingRow
        classes={{'twelve-col': true}}
        clickable={false}
        expanded={this.state.showAdd}>
        <div></div>
        <div className="twelve-col">
          {content}
        </div>
      </ExpandingRow>);
  }

  /**
    Generates the cloud logo element.
    @param {Object} overrides Any overrides that need to be passed in depending
      on where the component is being used.
    @return {Object} React component for DeploymentCloud.
  */
  _generateDeploymentCloud(overrides = {}) {
    const props = this.props;
    return (
      <DeploymentCloud
        key="deployment-cloud"
        acl={props.acl}
        addNotification={props.addNotification}
        cloud={overrides.cloud || this.state.cloud}
        controllerIsReady={props.controllerIsReady}
        listClouds={props.listClouds}
        getCloudProviderDetails={props.getCloudProviderDetails}
        setCloud={this._setCloud.bind(this)} />);
  }

  /**
    Generates the edit credential UI elements.
    @param {Object} credential The credential details of the credential being
      edited.
    @return {Array} The elements for the edit credential UI.
  */
  _generateEditCredentials(credential) {
    const credentialId = this.state.editCredential;
    if (credentialId && credentialId === credential.id) {
      const cloud = this.state.clouds[credential.cloud];
      return ([
        this._generateDeploymentCloud({cloud}),
        this._generateDeploymentCredentialAdd({
          cloud,
          name: credential.name,
          close: this._handleEditCredential.bind(this)
        })
      ]);
    }
  }

  /**
    Generate the add credentials UI with any supplied overrides depending
    on where it is to be rendered.
    @param {Object} overrides The overrides for the default props.
    @return {Object} React component for DeploymentCredentialAdd
  */
  _generateDeploymentCredentialAdd(overrides = {}) {
    return (
      <DeploymentCredentialAdd
        key="deployment-credential-add"
        acl={this.props.acl}
        addNotification={this.props.addNotification}
        close={overrides.close || this._toggleAdd.bind(this)}
        cloud={overrides.cloud || this.state.cloud}
        credentialName={overrides.name}
        credentials={this.state.credentials.map(credential =>
          credential.name)}
        getCloudProviderDetails={this.props.getCloudProviderDetails}
        generateCloudCredentialName={this.props.generateCloudCredentialName}
        getCredentials={this._getClouds.bind(this)}
        sendAnalytics={this.props.sendAnalytics}
        setCredential={this._setCredential.bind(this)}
        updateCloudCredential={this.props.updateCloudCredential}
        user={this.props.username}
        validateForm={this.props.validateForm} />);
  }

  render() {
    const clouds = this.state.clouds;
    let addButton = (
      <GenericButton
        action={this._toggleAdd.bind(this)}
        type="inline-neutral">
        {this.state.showAdd ? 'Cancel' : 'Add'}
      </GenericButton>);
    if (clouds && clouds[LOCAL_CLOUD]) {
      addButton = null;
    }
    return (
      <div className="account__section account__credentials twelve-col">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Cloud credentials
          </div>
          <div className="right">
            {addButton}
          </div>
        </div>
        {this._generateAddCredentials()}
        {this._generateCredentials()}
        {this._generateDeleteCredential()}
      </div>
    );
  }
};

AccountCredentials.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  controllerIsReady: PropTypes.func.isRequired,
  generateCloudCredentialName: PropTypes.func.isRequired,
  getCloudCredentialNames: PropTypes.func.isRequired,
  getCloudProviderDetails: PropTypes.func.isRequired,
  listClouds: PropTypes.func.isRequired,
  revokeCloudCredential: PropTypes.func.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  updateCloudCredential: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = AccountCredentials;

/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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
  _handleDeleteCredential(credential=null) {
    this.setState({'removeCredential': credential});
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
      <window.juju.components.Popup
        buttons={buttons}
        title="Remove credentials">
        <p>
          Are you sure you want to remove these credentials?
        </p>
      </window.juju.components.Popup>);
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
        <juju.components.Spinner />);
    }
    const credentialsList = credentials.map(credential => {
      const cloud = this.props.getCloudProviderDetails(credential.cloud);
      const title = cloud ? cloud.title : credential.cloud;
      return (
        <li className="user-profile__list-row twelve-col"
          key={credential.id}>
          <span className="six-col user-profile__list-col">
            {credential.name}
          </span>
          <span className="four-col user-profile__list-col">
            {title}
          </span>
          <span className="two-col last-col user-profile__list-col
              no-margin-bottom">
            <juju.components.GenericButton
              action={
                this._handleDeleteCredential.bind(this, credential.id)}
              disabled={credential.cloud === LOCAL_CLOUD}
              type="neutral">
              Remove
            </juju.components.GenericButton>
          </span>
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
      addForm = (
        <juju.components.DeploymentCredentialAdd
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          close={this._toggleAdd.bind(this)}
          cloud={this.state.cloud}
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
      chooseCloud = (
        <div className="account__credentials-choose-cloud">
          <juju.components.GenericButton
            action={this._setCloud.bind(this, null)}
            type="inline-neutral">
            Change cloud
          </juju.components.GenericButton>
        </div>);
    }
    if (this.state.showAdd) {
      content = (
        <div>
          {chooseCloud}
          <juju.components.DeploymentCloud
            acl={this.props.acl}
            addNotification={this.props.addNotification}
            cloud={this.state.cloud}
            controllerIsReady={this.props.controllerIsReady}
            listClouds={this.props.listClouds}
            getCloudProviderDetails={this.props.getCloudProviderDetails}
            setCloud={this._setCloud.bind(this)} />
          {addForm}
        </div>);
    }
    return (
      <juju.components.ExpandingRow
        classes={{'twelve-col': true}}
        clickable={false}
        expanded={this.state.showAdd}>
        <div></div>
        <div className="twelve-col">
          {content}
        </div>
      </juju.components.ExpandingRow>);
  }

  render() {
    const clouds = this.state.clouds;
    let addButton = (
      <juju.components.GenericButton
        action={this._toggleAdd.bind(this)}
        type="inline-neutral">
        {this.state.showAdd ? 'Cancel' : 'Add'}
      </juju.components.GenericButton>);
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

YUI.add('account-credentials', function() {
  juju.components.AccountCredentials = AccountCredentials;
}, '', {
  requires: [
    'deployment-cloud',
    'deployment-credential-add',
    'expanding-row',
    'generic-button',
    'loading-spinner',
    'popup'
  ]
});

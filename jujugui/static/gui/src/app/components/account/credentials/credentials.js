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

YUI.add('account-credentials', function() {

  juju.components.AccountCredentials = React.createClass({

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      generateCloudCredentialName: React.PropTypes.func.isRequired,
      getCloudCredentialNames: React.PropTypes.func.isRequired,
      getCloudProviderDetails: React.PropTypes.func.isRequired,
      listClouds: React.PropTypes.func.isRequired,
      revokeCloudCredential: React.PropTypes.func.isRequired,
      updateCloudCredential: React.PropTypes.func.isRequired,
      username: React.PropTypes.string.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        cloud: null,
        credentials: [],
        loading: false,
        showAdd: false
      };
    },

    componentWillMount: function() {
      this._getClouds();
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    /**
      Retrieve the list of clouds.

      @method _getClouds
    */
    _getClouds: function() {
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
    },

    /**
      Retrieve the list of credential names for the user.

      @method _getCloudCredentialNames
      @param {Array} clouds A list of cloud ids.
    */
    _getCloudCredentialNames: function(clouds) {
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
            cloud.names.forEach(name => {
              credentials.push({
                name: name,
                // Store the cloud for this name.
                cloud: pairs[i][1]
              });
            });
          });
          this.setState({
            credentials: credentials,
            loading: false,
          });
        });
      this.xhrs.push(xhr);
    },

    /**
      Handle deleting a credential.

      @method _handleDeleteCredential
      @param credential {String} A credential id.
    */
    _handleDeleteCredential: function(credential) {
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
          if (cred.name !== credential) {
            return true;
          }
        });
        this.setState({credentials: credentials});
      });
      this.xhrs.push(xhr);
    },

    /**
      Generate a list of credentials.

      @method _generateCredentials
    */
    _generateCredentials: function() {
      const credentials = this.state.credentials;
      if (this.state.loading) {
        return (
          <juju.components.Spinner />);
      }
      const credentialsList = credentials.map(credential => {
        const cloud = this.props.getCloudProviderDetails(credential.cloud);
        return (
          <li className="user-profile__list-row twelve-col"
            key={credential.name}>
              <div className="six-col no-margin-bottom">
                {credential.name}
              </div>
              <div className="four-col no-margin-bottom">
                {cloud.title}
              </div>
              <div className="two-col last-col no-margin-bottom">
                <juju.components.GenericButton
                  action={
                    this._handleDeleteCredential.bind(this, credential.name)}
                  type="neutral"
                  title="Remove" />
              </div>
          </li>);
      });
      if (credentialsList.length > 0) {
        return (
          <ul className="user-profile__list twelve-col">
            <li className="user-profile__list-header twelve-col">
              <div className="six-col no-margin-bottom">
                Name
              </div>
              <div className="six-col last-col no-margin-bottom">
                Provider
              </div>
            </li>
            {credentialsList}
          </ul>);
      } else {
        return (
          <div>
            No credentials available.
          </div>);
      }
    },

    /**
      Show the add credentials form.

      @method _toggleAdd
    */
    _toggleAdd: function() {
      // The cloud needs to be reset so that when the form is shown it doesn't
      // show the last selected cloud.
      this.setState({showAdd: !this.state.showAdd, cloud: null});
    },

    /**
      Store the selected cloud in state.

      @method _setCloud
      @param {String} cloud The selected cloud.
    */
    _setCloud: function(cloud) {
      this.setState({cloud: cloud});
    },

    /**
      Store the selected credential in state.

      @method _setCredential
      @param {String} credential The selected credential.
    */
    _setCredential: function(credential) {
      this.setState({credential: credential});
    },

    /**
      Generate a form to add credentials.

      @method _generateAddCredentials
    */
    _generateAddCredentials: function() {
      let content = null;
      let addForm = null;
      let chooseCloud = null;
      if (this.state.showAdd && this.state.cloud) {
        addForm = (
          <juju.components.DeploymentCredentialAdd
            acl={this.props.acl}
            addNotification={this.props.addNotification}
            close={this._toggleAdd}
            cloud={this.state.cloud}
            getCloudProviderDetails={this.props.getCloudProviderDetails}
            generateCloudCredentialName={this.props.generateCloudCredentialName}
            getCredentials={this._getClouds}
            setCredential={this._setCredential}
            updateCloudCredential={this.props.updateCloudCredential}
            user={this.props.username}
            validateForm={this.props.validateForm} />);
        chooseCloud = (
          <div className="account__credentials-choose-cloud">
            <juju.components.GenericButton
              action={this._setCloud.bind(this, null)}
              type="inline-neutral"
              title="Change cloud" />
          </div>);
      }
      if (this.state.showAdd) {
        content = (
          <div>
            {chooseCloud}
             <juju.components.DeploymentCloud
               acl={this.props.acl}
               cloud={this.state.cloud}
               listClouds={this.props.listClouds}
               getCloudProviderDetails={this.props.getCloudProviderDetails}
               setCloud={this._setCloud} />
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
    },

    render: function() {
      return (
        <div className="account__section account__credentials">
          <h2 className="account__title twelve-col">
            Cloud credentials
            <juju.components.GenericButton
              action={this._toggleAdd}
              type="inline-base"
              title="Add" />
          </h2>
          {this._generateAddCredentials()}
          {this._generateCredentials()}
        </div>
      );
    }

  });

}, '', {
  requires: [
    'deployment-cloud',
    'deployment-credential-add',
    'expanding-row',
    'generic-button',
    'loading-spinner'
  ]
});

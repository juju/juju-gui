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
      getCloudCredentialNames: React.PropTypes.func.isRequired,
      getCloudProviderDetails: React.PropTypes.func.isRequired,
      listClouds: React.PropTypes.func.isRequired,
      revokeCloudCredential: React.PropTypes.func.isRequired,
      username: React.PropTypes.string.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        credentials: [],
        loading: false
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

    render: function() {
      return (
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Cloud credentials
          </h2>
          {this._generateCredentials()}
        </div>
      );
    }

  });

}, '', {
  requires: [
    'generic-button',
    'loading-spinner'
  ]
});

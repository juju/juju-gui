/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

YUI.add('deployment-credential', function() {

  juju.components.DeploymentCredential = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      cloud: React.PropTypes.object,
      credential: React.PropTypes.string,
      editable: React.PropTypes.bool,
      generateCloudCredentialName: React.PropTypes.func.isRequired,
      getCloudCredentialNames: React.PropTypes.func.isRequired,
      getCloudCredentials: React.PropTypes.func.isRequired,
      getCloudProviderDetails: React.PropTypes.func.isRequired,
      region: React.PropTypes.string,
      setCredential: React.PropTypes.func.isRequired,
      setRegion: React.PropTypes.func.isRequired,
      updateCloudCredential: React.PropTypes.func.isRequired,
      user: React.PropTypes.string,
      validateForm: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        credentials: [],
        credentialsLoading: true,
        showAdd: this.props.editable
      };
    },

    componentWillMount: function() {
      this._getCredentials();
    },

    componentDidUpdate: function(prevProps) {
      const prevId = prevProps.cloud && prevProps.cloud.name;
      const newId = this.props.cloud && this.props.cloud.name;
      if (newId !== prevId) {
        this._getCredentials();
      }
    },

    /**
      Request credentials from the controller.

      @method _getCredentials
      @param {String} credential An optional credential name to select after
        loading the list.
    */
    _getCredentials: function(credential) {
      const cloud = this.props.cloud && this.props.cloud.name;
      const user = this.props.user;
      if (user) {
        this.props.getCloudCredentialNames(
          [[user, cloud]],
          this._getCloudCredentialNamesCallback.bind(this, credential));
      }
    },

    /**
      The method to be called when the credentials names response has been
      received.

      @method _getCloudCredentialNamesCallback
      @param {String} credential An optional credential name to select after
        loading the list.
      @param {String} error An error message, or null if there's no error.
      @param {Array} tags A list of the tags found.
    */
    _getCloudCredentialNamesCallback: function(credential, error, names) {
      if (error) {
        console.error('unable to get names for credentials:', error);
        return;
      }
      // The resulting array of names will be in the order that the cloud/user
      // pairs were passed to getCloudCredentialNames. As we're only passing
      // one pair we can safely assume that we only need the first item in the
      // array.
      const nameList = names.length && names[0].names || [];
      this.props.getCloudCredentials(
        nameList, this._getCredentialsCallback.bind(this, credential));
    },

    /**
      The method to be called when the credentials response has been received.

      @method _getCredentialsCallback
      @param {String} credential An optional credential name to select after
        loading the list.
      @param {String} error An error message, or null if there's no error.
      @param {Array} credentials A list of the credentials found.
    */
    _getCredentialsCallback: function(credential, error, credentials) {
      if (error) {
        console.error('Unable to get credentials', error);
        return;
      }
      const credentialList = Object.keys(credentials);
      this.setState({
        credentials: credentialList,
        credentialsLoading: false,
        // If there are no credentials then display the form to add credentials.
        showAdd: this.props.editable &&
          (!credentials || credentialList.length === 0)
      });
      if (credentials && credentialList.length > 0) {
        let select = credentialList[0];
        // If the supplied credential to select is actually in the list then
        // select it.
        if (credentials[credential]) {
          select = credential;
        }
        this.props.setCredential(select);
        // The shallow renderer can't have refs set up before the first mount
        // so we have to check that we have refs before we make this call. We
        // need to figure out some way to properly handle refs.
        if (this.refs.credential) {
          this.refs.credential.setValue(select);
        }
      }
    },

    /**
      Show the add credentials form.

      @method _toggleAdd
    */
    _toggleAdd: function() {
      const showAdd = !this.state.showAdd;
      // When displaying the add credentials form we need to clear the
      // currently selected credential in case someone tries to deploy while
      // the add credential form is open.
      if (showAdd) {
        this.props.setCredential(null);
      }
      this.setState({showAdd: showAdd});
    },

    /**
      Generate the list of credential options.

      @method _generateCredentials
      @returns {Array} The list of credential options.
    */
    _generateCredentials: function() {
      var credentials = this.state.credentials.map((credential) => {
        return {
          label: credential,
          value: credential
        };
      });
      credentials.push({
        label: 'Add credential...',
        value: 'add-credential'
      });
      return credentials;
    },

    /**
      Set the credential value or navigate to the add credentails form.

      @method _handleCredentialChange
      @param {String} The select value.
    */
    _handleCredentialChange: function(value) {
      if (value === 'add-credential') {
        this._toggleAdd();
      } else {
        this.props.setCredential(value);
      }
    },

    /**
      Generate the list of region options.

      @method _generateRegions
      @returns {Array} The list of region options.
    */
    _generateRegions: function() {
      const regions = !this.props.editable ? [{name: this.props.region}] :
        this.props.cloud && this.props.cloud.regions || [];
      // Setup the default option.
      let regionList = [
        {label: 'Default', value: ''}
      ];
      if (regions.length && regions.length > 0) {
        // Setup each region option.
        const regionValues = regions.map(region => {
          return {
            label: region.name,
            value: region.name
          };
        });
        // Return the default option + the regions.
        regionList = regionList.concat(regionValues);
      }
      return regionList;
    },

    /**
      Generate a change cloud action if a cloud has been selected.

      @method _generateAction
      @returns {Array} The list of actions.
    */
    _generateSelect: function() {
      if (this.state.showAdd) {
        return;
      }
      var disabled = this.props.acl.isReadOnly();
      return (
        <form className="deployment-credential__form">
          <div className="prepend-two four-col">
          <juju.components.InsetSelect
            disabled={disabled}
            label="Credential"
            onChange={this._handleCredentialChange}
            options={this._generateCredentials()}
            ref="credential"
            value={this.props.credential} />
          </div>
          <div className="four-col">
            <juju.components.InsetSelect
              disabled={disabled || !this.props.editable}
              label="Region"
              onChange={this.props.setRegion}
              options={this._generateRegions()}
              value={this.props.region} />
          </div>
        </form>);
    },

    /**
      Generate the form for adding a credential.

      @method _generateAdd
      @returns {Array} The credential form.
    */
    _generateAdd: function() {
      if (!this.state.showAdd) {
        return;
      }
      return (
        <juju.components.DeploymentCredentialAdd
          acl={this.props.acl}
          close={this._toggleAdd}
          cloud={this.props.cloud}
          getCloudProviderDetails={this.props.getCloudProviderDetails}
          generateCloudCredentialName={this.props.generateCloudCredentialName}
          getCredentials={this._getCredentials}
          setCredential={this.props.setCredential}
          updateCloudCredential={this.props.updateCloudCredential}
          user={this.props.user}
          validateForm={this.props.validateForm} />);
    },

    /**
      Display the credentials or a spinner if the data is loading.

      @method _generateContent
      @returns {Object} The dom elements.
    */
    _generateContent: function() {
      if (this.state.credentialsLoading) {
        return (
          <div className="deployment-credential__loading">
            <juju.components.Spinner />
          </div>);
      }
      return (
        <juju.components.ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={this.state.showAdd}>
          {this._generateSelect()}
          {this._generateAdd()}
        </juju.components.ExpandingRow>);
    },

    render: function() {
      return (
        <div>
          {this._generateContent()}
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-credential-add',
    'expanding-row',
    'inset-select',
    'loading-spinner'
  ]
});

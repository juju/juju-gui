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
      addTemplate: React.PropTypes.func.isRequired,
      cloud: React.PropTypes.object,
      clouds: React.PropTypes.object.isRequired,
      credential: React.PropTypes.string,
      getCloudCredentials: React.PropTypes.func.isRequired,
      getTagsForCloudCredentials: React.PropTypes.func.isRequired,
      listRegions: React.PropTypes.func.isRequired,
      region: React.PropTypes.string,
      setCredential: React.PropTypes.func.isRequired,
      setRegion: React.PropTypes.func.isRequired,
      setTemplate: React.PropTypes.func.isRequired,
      template: React.PropTypes.string,
      users: React.PropTypes.object.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    regionsXHR: null,

    getInitialState: function() {
      return {
        credentials: [],
        credentialsLoading: true,
        regions: [],
        regionsLoading: true,
        showAdd: true
      };
    },

    componentWillMount: function() {
      this._getCredentials();
      this._getRegions();
    },

    componentDidUpdate: function(prevProps) {
      const prevId = prevProps.cloud && prevProps.cloud.id;
      const newId = this.props.cloud && this.props.cloud.id;
      if (newId !== prevId) {
        this._getCredentials();
        this._getRegions();
      }
    },

    componentWillUnmount: function() {
      if (this.regionsXHR) {
        this.regionsXHR.abort();
      }
    },

    /**
      Request credentials from JEM.

      @method _getCredentials
    */
    _getCredentials: function() {
      const cloud = this.props.cloud && this.props.cloud.id;
      const user = this.props.users.jem.user;
      if (user) {
        this.props.getTagsForCloudCredentials(
          [[user, cloud]], this._getTagsCallback);
      }
    },

    /**
      The method to be called when the credentials tags reponse has been
      received.

      @method _getTagsCallback
      @param {String} error An error message, or null if there's no error.
      @param {Array} tags A list of the tags found.
    */
    _getTagsCallback: function(error, tags) {
      if (error) {
        console.error('Unable to get tags for credentials', error);
        return;
      }
      // The resulting array of tags will be in the order that the cloud/user
      // pairs were passed to getTagsForCloudCredentials. As we're only passing
      // one pair we can safely assume that we only need the first item in the
      // array.
      const tagList = tags && tags[0] && tags[0].tags || [];
      this.props.getCloudCredentials(tagList, this._getCredentialsCallback);
    },

    /**
      The method to be called when the credentials response has been received.

      @method _getCredentialsCallback
      @param {String} error An error message, or null if there's no error.
      @param {Array} credentials A list of the credentials found.
    */
    _getCredentialsCallback: function(error, credentials) {
      if (error) {
        console.error('Unable to get credentials', error);
        return;
      }
      const credentialList = Object.keys(credentials).map(
        credential => credentials[credential].name);
      this.setState({
        credentials: credentialList,
        credentialsLoading: false,
        // If there are no credentials then display the form to add credentials.
        showAdd: !credentials || credentialList.length === 0
      });
      if (credentials && credentialList.length > 0) {
        this.props.setCredential(credentialList[0]);
      }
    },

    /**
      Request regions from JEM.

      @method _getRegions
    */
    _getRegions: function() {
      var props = this.props;
      var cloud = props.cloud;
      if (!cloud) {
        this.setState({
          regionsLoading: false
        });
        return;
      }
      this.regionsXHR = props.listRegions(cloud, this._getRegionsCallback);
    },

    /**
      The method to be called when the regions reponse has been received.

      @method _getRegionsCallback
      @param {String} error An error message, or null if there's no error.
      @param {Array} regions A list of the regions found.
    */
    _getRegionsCallback: function(error, regions) {
      if (error) {
        console.error('Unable to list templates', error);
        return;
      }
      this.setState({
        regions: regions,
        regionsLoading: false
      });
    },

    /**
      Show the add credentials form.

      @method _toggleAdd
    */
    _toggleAdd: function() {
      this.setState({showAdd: !this.state.showAdd});
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
      return this.state.regions.map((region) => {
        return {
          label: region,
          value: region
        };
      });
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
            options={this._generateCredentials()} />
          </div>
          <div className="four-col">
            <juju.components.InsetSelect
              disabled={disabled}
              label="Region"
              onChange={this.props.setRegion}
              options={this._generateRegions()} />
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
          addTemplate={this.props.addTemplate}
          close={this._toggleAdd}
          cloud={this.props.cloud}
          clouds={this.props.clouds}
          regions={this.state.regions}
          setCredential={this.props.setCredential}
          setRegion={this.props.setRegion}
          setTemplate={this.props.setTemplate}
          users={this.props.users}
          validateForm={this.props.validateForm} />);
    },

    /**
      Display the credentials or a spinner if the data is loading.

      @method _generateContent
      @returns {Object} The dom elements.
    */
    _generateContent: function() {
      if (this.state.credentialsLoading || this.state.regionsLoading) {
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
